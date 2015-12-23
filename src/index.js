"use strict";
/* global process */

const fs = require("fs-extra");
const path = require("path");
const EventEmitter = require("events");

const Errors = {
	NO_LOCATION: new Error("You have not specified a location for the finder!"),
	ALREADY_SCANNING: new Error("A scan is already in progress!"),
	PAUSED: new Error("The scanner has been paused!")
};

class ContentFinder extends EventEmitter{

	constructor(options) {

		super();

		options = options || {};

		options.location = options.location || process.cwd();
		options.validity = options.validity || (() => false);

		this.already_found = options.already_found || [];
		this.scanning = false;
		this.paused = false;
		this.options = options;

		if (this.options.interval)
			// can't just use this.search because the context
			// messes up
			setTimeout(() => this.search(), this.options.interval);

	}

	pause() {
		this.paused = true;
	}

	unpause() {
		this.paused = false;
		this.search();
	}

	search() {
		return new Promise((resolve, reject) => {

			if (!this.options.location)
				throw Errors.NO_LOCATION;


			if (this.scanning)
				throw Errors.ALREADY_SCANNING;


			if (this.paused)
				throw Errors.PAUSED;

			this.scanning = true;

			let dir = this.options.location;
			let found = [];

			fs.walk(dir)
				.on("data", item => {
					if (this.options.validity(item)) {
						found.push(item.path);
					}
				})
				.on("error", e => { })
				.on("end", () => {
					this.scanning = false;

					resolve(this.check_differences(found));

					if (this.options.interval)
						// can't just use this.search because the context
						// messes up
						setTimeout(() => this.search(), this.options.interval);
				})
		});
	}

	check_differences(new_array){

		/*	to find additions, subtract the elements from the old array from
			the new array, the resulting array is the additions.

			to find deletions, subtract the elements from the new array from
			the old array, the result array is the deletions.			  */

		let additions = [],
			deletions = [];

		let old_array = this.already_found;

		// ADDITIONS
		for(let item of new_array){
			let ind = old_array.indexOf(item);
			if(!~ind)
				additions.push(item);
		}

		// DELETIONS
		for(let item of old_array){
			let ind = new_array.indexOf(item);
			if(!~ind)
				deletions.push(item);
		}

		this.already_found = new_array;

		if(additions.length + deletions.length > 0){
			this.emit("change", additions, deletions, new_array);
		}

		return ({additions, deletions});

	}

}

module.exports = ContentFinder;