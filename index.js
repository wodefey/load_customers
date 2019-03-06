const MongoClient = require("mongodb").MongoClient
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const util = require("util")

const data = fs.readFileSync('customers.csv');
const rows = parse(data, {columns: true, trim: true});

const customers = [];

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
		customer.brew_logs = {'2019.02.27' : true};
	} else {
		customer.brew_logs  = {'2019.0217' : false};
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

		// Drop existing inventory collection
		let result = await col.findOne({'email': customers[0].email});
  
		// Insert test inventory documents
		console.log(result);
    } catch (err) {
		console.log(err.message);
    } finally {
		client.close();
    }
})();

console.log(customers);