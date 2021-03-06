(function () {
	
	var config = {
		
		debug: false,
		
		node: {
			web_path: './web',
			gollumjs_path: typeof __dirname !== 'undefined' ? __dirname : "" // Fonctionne uniquement en context nodejs
		},

		src: {
			path: [ './src', '%node.gollumjs_path%/index.js' ],
			excludesPath: ["%node.gollumjs_path%/src"],
			excludesFiles: ['.git', '.svn', '.hg']
		},
		cache: {
			path: './tmp/cache',
		},

		dependency: {
			'rsvp': '//rsvpjs-builds.s3.amazonaws.com/rsvp-latest.min.js'
		},

		services: {

			fileJSParser: {
				class: 'GollumJS.Reflection.FileJSParser.FileJSParser',
				args: [
					"@cache",
					"%fileJSParser.srcPath%",
					"%fileJSParser.excludesPath%",
					"%fileJSParser.excludesFiles%"
				]
			},
			cache       : {
				class: 'GollumJS.Cache.Cache',
				args: [ 
					"%cache.path%"
				]
			}

		}

	};

	if (GollumJS.config != 'undefined') {
		GollumJS.Utils.extend (config, GollumJS.config);
	}
	GollumJS.config = config;
	GollumJS.cache = {};

	var _instances = {};
	var _tags = {};
	
	GollumJS.get = function (name) {
		
		if (!_instances[name] && GollumJS.config.services[name] && GollumJS.config.services[name].class) {
			
			var finalName = GollumJS.Parser.ArgumentsParser.parseConfig(GollumJS.config.services[name].class);
			var __service__ = GollumJS.Reflection.ReflectionClass.getClassByName (finalName);
			var __args__    = (new GollumJS.Parser.ArgumentsParser(
				GollumJS.config.services[name].args ? GollumJS.config.services[name].args : [] 
			)).parse();
			__args__.unshift(null);
			
			if (__service__) {
				var instance = new (Function.prototype.bind.apply(__service__, __args__));
				
				if (typeof GollumJS.config.services[name].inject != 'undefined') {
					for (var method in GollumJS.config.services[name].inject) {
						var tags = GollumJS.getByTag(GollumJS.config.services[name].inject[method]);
						for (var i = 0; i < tags.length; i++) {
							var instanceTag = tags[i].instance;
							delete(tags[i].instance);
							instance[method](instanceTag, tags[i]);
						}
					}
				}
				
				GollumJS.set(name, instance);
			} else {
				console.warn('Class service '+name+' not found: ', GollumJS.config.services[name]);
			}
		}
		
		return _instances[name];
	};
	
	GollumJS.getByTag = function (tag) {
		if (typeof _tags[tag] == 'undefined') {
			_tags[tag] = [];
			
			for (var id in GollumJS.config.services) {
				if (typeof GollumJS.config.services[id].tags != 'undefined') {
					var config = GollumJS.config.services[id].tags;
					for (var i = 0; i < config.length; i++) {
						if (config[i].name == tag) {
							_tags[tag].push(
								GollumJS.Utils.extend({
									instance: GollumJS.get(id)
								}, config[i])
							);
						}
					}
				}
			}
		}
		return _tags[tag];
	};
	
	GollumJS.set = function (name, object) {
		_instances[name] = object;
	};
	
	GollumJS.getParameter = function (key) {
		return GollumJS.Parser.ArgumentsParser.parseConfig('%'+key+'%');
	};
	
	(function () {
		
		console       = typeof console       !== 'undefined' ? console       : function() {};
		console.log   = typeof console.log   !== 'undefined' ? console.log   : function() {};
		console.error = typeof console.error !== 'undefined' ? console.error : console.log;
		console.info  = typeof console.info  !== 'undefined' ? console.info  : console.log;
		console.warn  = typeof console.warn  !== 'undefined' ? console.warn  : console.log;
		console.debug = typeof console.debug !== 'undefined' ? console.debug : console.info;
		console.trace = typeof console.trace !== 'undefined' ? console.trace : console.log;
		
		var trace = console.error;
		console.error = function () {
			
			var args = [];
			var display = [];

			for (var i = 0; i < arguments.length; i++) {
				args.push(arguments[i]);
			}
			
			for (var i = 0; i < arguments.length; i++) {
				var arg = args.shift();
				 if (arg instanceof Error || GollumJS.Exception.isInstance (arg)) {
				 	if (display.length) {
						trace.apply(console, display);
					}	
					trace.call(console, '=== Error === ');
					if (arg.message) {
						trace.call(console, '  message: '+arg.message);
					} else {
						trace.call(console, "  ", arg);
					}
					if (arg.stack) {
						trace.call(console, '  stack:\n  '+arg.stack+"\n");
					}

					trace.call(console, arg);

					return console.error.apply(console, args);
				}
				display.push(arg);
			}
			return trace.apply(console, display);
		};
	})();
	
}) ();