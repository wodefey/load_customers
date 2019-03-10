const MongoClient = require("mongodb").MongoClient
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const util = require("util")

const data = fs.readFileSync('customers.csv');
const rows = parse(data, {columns: true, trim: true});

const customers = [];
let doc_updated = 0;
let doc_inserted = 0;

rows.forEach(row => {
	let customer = {};

	customer.firstname = row['First Name'];
	customer.lastname = row['Last Name'];
	customer.email = row['Email'];
	customer.zipcode = row['Zipcode'];

	if (row['Confirmed?']) {
		customer.confirmed = true;
	} else {
		customer.confirmed = false;
	}

	if (row['Announcement']) {
		customer.announcement = true;
	} else {
		customer.announcement = false;
	}

	if (row['Brew Log 2019.02.27']) {
		customer.brew_logs = {'2019-02-27' : true};
		customer.newsletter = true;
	} else {
		customer.brew_logs  = {'2019-02-27' : false};
		customer.newsletter = false;
	}

	customers.push(customer);
});

(async () => {
    let client;
  
    try {
		const port = 7854;
		const targetDB = "production";
		const user = encodeURIComponent("developer");
		const pwd = encodeURIComponent("vdL42as9");
		const authMechanism = "DEFAULT";
	
		const url = util.format("mongodb://%s:%s@localhost:%d", user, pwd, port);

		client = await MongoClient.connect(url);

		// Access production database
		const db = client.db(targetDB);
  
		// Select collection for insert
		const col = db.collection('customers');

		// Find last customer id
		let doc = await col.find().sort({'id': -1}).limit(1).toArray();
		let last_id = doc[0]['id'];
		console.log(`Last production id: ${last_id}`);

		const null_billing_address = {
			billing_firstname: '',
			billing_lastname: '',
			billing_address1: '',
			billing_address2: '',
			billing_city: '',
			billing_state: '',
			billing_zipcode: ''
		};

		const null_shipping_address = {
			shipping_firstname: '',
			shipping_lastname: '',
			shipping_address1: '',
			shipping_address2: '',
			shipping_city: '',
			shipping_state: '',
			shipping_zipcode: ''
		};

		for (customer of customers) {
			doc = await col.findOne({'email': customer.email});
			if (doc) {
				console.log(`Customer found: ${doc.email}`);

				if (!doc.firstname) {
					doc.firstname = customer.firstname;
				}

				if (!doc.lastname) {
					doc.lastname = customer.lastname;
				}

				if (!customer.zipcode) {
					doc.zipcode = customer.zipcode;
				}

				doc.confirmed = customer.confirmed;
				doc.newsletter = customer.newsletter;
				doc.announcement = customer.announcement;
				doc.brew_logs  = customer.brew_logs;

				try {
					let result = await col.updateOne({'email': customer.email}, {$set: doc});
					if (result.modifiedCount != 1) {
						throw new Error(`Error updating customer ${doc.lastname}`);
					}
				} catch (err) {
					console.log(err.message);
				}

				doc_updated += 1;
			} else {
				console.log(`Customer not found: ${customer.email}`)
				last_id += 1;
				customer.id = last_id;

				customer.notes = '';

				customer.billing_address = null_billing_address;
				customer.shipping_address = null_shipping_address;

				try {
					let result = await col.insertOne(customer);
					if (result.insertedCount != 1) {
						throw new Error(`Error inserting customer ${customer.lastname} into database`);
					}
				} catch (err) {
					console.log(err.message);
				}

				doc_inserted += 1;
			}
		}

    } catch (err) {
		console.log(err.message);
    } 
	
})();
