# **reflex** content-discovery
A smart and fast content discoverery system.

`npm install --save ReflexHub/content-discovery`

## Usage

```js
const ContentFinder = require("../");
const finder = new ContentFinder({
	interval : 5000,
	locations : ["/home/hydrabolt/Videos", "/home/hydrabolt/Music"],
	validity : item => {
		return item.path.endsWith("mp3")
	}
});

finder.on("change", (additions, deletions, overall) => {
	console.log(additions);
	console.log(deletions);
});
```