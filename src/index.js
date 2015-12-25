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

class ContentFinder extends EventEmitter {

	constructor(options) {

		super();

		options = options || {};

		options.locations = options.locations || [process.cwd()];
		options.validity = options.validity || (() => false);
		options.watch = options.watch || false;

		this.already_found = options.already_found || [];
		this.scanning = false;
		this.paused = false;
		this.options = options;
		this.search();

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

			if (!this.options.locations)
				throw Errors.NO_LOCATION;


			if (this.scanning)
				throw Errors.ALREADY_SCANNING;


			if (this.paused)
				throw Errors.PAUSED;

			this.scanning = true;

			let found = [], promises = [];

			for(let dir of this.options.locations){
				promises.push(this.walk_indiv(dir));
			}

			Promise.all(promises).then(arrays => {
				//console.log(v);
				let orig_array = [];
				for(let array of arrays){
					orig_array = orig_array.concat(array.filter(i => orig_array.indexOf(i) < 0));
				}
				resolve(this.check_differences(orig_array));
				this.scanning = false;
				if(this.options.interval)
					setTimeout(() => this.search(), this.options.interval);
			});
		});
	}

	walk_indiv(dir) {
		return new Promise((resolve, reject) => {

			let found = [];

			fs.walk(dir)
				.on("data", item => {
					if (this.options.validity(item)) {
						found.push(item.path);
					}
				})
				.on("error", e => {})
				.on("end", () => {
					resolve(found);
				});
		})
	}

	check_differences(new_array) {

		/*	to find additions, subtract the elements from the old array from
			the new array, the resulting array is the additions.

			to find deletions, subtract the elements from the new array from
			the old array, the result array is the deletions.			  */

		let additions = [],
			deletions = [];

		let old_array = this.already_found;

		// ADDITIONS
		for (let item of new_array) {
			let ind = old_array.indexOf(item);
			if (!~ind)
				additions.push(item);
		}

		// DELETIONS
		for (let item of old_array) {
			let ind = new_array.indexOf(item);
			if (!~ind)
				deletions.push(item);
		}

		this.already_found = new_array;

		if (additions.length + deletions.length > 0) {
			this.emit("change", additions, deletions, new_array);
		}

		return ({ additions, deletions });

	}

}

module.exports = ContentFinder;