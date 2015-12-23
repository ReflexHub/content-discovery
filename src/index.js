"use strict";
/* global process */

const fs = require("fs-extra");
const path = require("path");

const Errors = {
	NO_LOCATION : new Error("You have not specified a location for the finder!"),
	ALREADY_SCANNING : new Error("A scan is already in progress!"),
	PAUSED : new Error("The scanner has been paused!")
};

class ContentFinder {

	constructor(options) {

		options = options || {};

		options.location = options.location || process.cwd();
		options.validity = options.validity || (() => false);

		this.scanning = false;
		this.paused = false;
		this.options = options;

	}

	pause(){
		this.paused = true;
	}

	unpause(){
		this.paused = false;
		this.search();
	}

	search() {
		return new Promise((resolve, reject) => {
			if (!this.options.location) {
				throw Errors.NO_LOCATION;
				return;
			}

			if(this.scanning){
				throw Errors.ALREADY_SCANNING;
				return;
			}

			if(this.paused){
				throw Errors.PAUSED;
				return;
			}

			this.scanning = true;

			let dir = this.options.location;
			let found = [];

			fs.walk(dir)
				.on("data", item => {
					if(this.options.validity(item)){
						found.push(item.path);
					}
				})
				.on("error", e => { })
				.on("end", () => {
					resolve(found);
					this.scanning = false;

					if(this.options.interval)
						// can't just use this.search because the context
						// messes up
						setTimeout(() => this.search(), this.options.interval);
				})
		});
	}

}

module.exports = ContentFinder;