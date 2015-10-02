GT.create({

	name: "TestWriteCache",

	cache: null,
	fs: null,


	beforeProcess: function () {
		this.clean();
		this.cache = new GollumJS.Cache.Cache("./tmp/cache");
	},

	afterProcess: function (a) {
		this.clean();
	},

	clean: function (a) {
		if (GollumJS.Utils.isNodeContext()) {
			this.fs = require('node-fs');
			var rmdir = require('rimraf').sync;
			
			if (this.fs.existsSync("./tmp")) {
				rmdir("./tmp");
			}
		}
	},

	/**
	 * Test si un constructeur simple
	 */
	testSetSimpleValue: function (a) {
		
		this.cache.set("testVar1", "testValue1");

		a.assertTrue (GollumJS.cache["testVar1"] === "testValue1");


	},

	/**
	 * Test si un constructeur simple
	 */
	testWriteJS: function (a) {
		
		this.cache.set("testVar1", "testValue1");
		var sync = false;
		this.cache.writeJS(function (err) {
			if (GollumJS.Utils.isNodeContext()) {
				a.assertTrue (err === null);
			}
			sync = true;
		});
		if (GollumJS.Utils.isNodeContext()) {
			while (sync);
			a.assertTrue (this.fs.existsSync("./tmp/cache/datas.js"));
		}
	}

});