/*
	InputMagic v0.1.0
	https://github.com/ideasmashup/input-magic

	By William ANGER, ISC License, July 2014
*/

(function($, window, document, undefined){

	// @bobince, stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711
	function noregex(str) {
		return str ? str.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&') : '';
	}

	function trim(str, pattern) {
		return str.replace(pattern || /^\s+|\s+$/g, '');
	}
	
	function format(template, map) {
		return template.replace(/{([a-z_][a-z0-9_]*)}/gi, function(tag, name) {
			return map[name] ? map[name] : '';
		});
	}
	
	function inputMagicEmailModule(options) {
		this.rules = [];
		this.init(options);
	}
	
	function is(type, obj) {
		var clas = Object.prototype.toString.call(obj).slice(8, -1);
		return obj !== undefined && obj !== null && clas === type;
	}
	
	inputMagicEmailModule.prototype = {
		init: function(options) {
			// module constructor
			var defaults = {
				do_validate: true,
				do_autocomplete: true,
				list_accounts : ['amazing','blithesome','charismatic','decisive','excellent','fantastical','great','heroic','incredible','jolly','kickstarter','light','magical','nice','outstanding','perfect','quality','remarkable','smart','thrilling','ultimate','vibrant','wondrous','xylophone','yes_we_can','zippy'],
				list_hosts : ['hotmail','live','yahoo','gmail','orange','aol','free','numericable'],
				list_tlds : ['com','fr','eu','org','us','net','io'],
			};

			this.options = $.extend({}, defaults, options);

			// optimize module rules for faster parsing
			this.rules = this.rules_optimize(this.options.rules)[0];
		},

		rules_optimize : function(rules) {
			var optimized = [], rule;

			if (is('Array', rules)) {
				// rule in a collection of other rules and string "separators"

				if (rules.length > 0) {
					for (var i = 0; i<rules.length; i++) {
						rule = rules[i];

						if (is('String', rule)) {
							// don't store strings, they are copied into rules' 
							// .before and .after
						}
						else if (is('Object', rule)) {
							// inject sibling separators inside the rule object

							if (rules.length > i + 1 && is('String', rules[i + 1])) {
								// string separator after
								rule.after = rules[i + 1];
							}

							if (0 >= i - 1 && is('String', rules[i - 1])) {
								// string separator after
								rule.before = rules[i - 1];
							}

							if (rule.rules !== undefined) {
								// optimize sub-rules recursively
								rule.rules = this.rules_optimize(rule.rules);
							}

							// push optimized rule to final rules array
							optimized.push(rule);
						}
					}
				}
			}
			else if (is('Object', rules)) {
				// not part of an array, push immediately
				optimized.push(rules);
			}

			return optimized;
		},

		apply_rule : function(rule, value, text, length) {
			var lmin = (rule.minlength !== undefined)? rule.minlength : 0;
			var lmax = (rule.maxlength !== undefined)? rule.maxlength : 65535;

			if (text.length < lmin) {
				// too short
				this.trigger('error', format('{rulename} value is too short. Must be longer than {length} character(s)', {rulename: rule.name, lenght: lmin}));
			}
			else if (text.length > lmax) {
				// too long
				this.trigger('error', format('{rulename} value is too long. Cannot exceed {length} character(s)', {rulename: rule.name, lenght: lmax}));
			}
			
			if (rule.pattern !== undefined) {
				// validate against RegExp pattern
				
				if (rule.pattern.test(local)) {
					// correct value
					this.trigger('validation', {success: true, msg: format('{rulename} is correct!', {rulename: rule.name})})
				}
				else {
					// incorrect
					this.trigger('error', format('{rulename} is incorrect!'))
				}
			}
			
			if (rule.hints !== undefined) {
				// do autocompletion using the hints array elements
				var next_separator = '';

				if (text.length > 0) {
					// we seek hints only after >= 1 char has been typed
					return this.seek_hint(text, rule.hints, 1, true, next_separator);
				}
			}

			// complete with "best guesses" (or "motivationnal" words)
			if (text.indexOf('@') == -1) {
				if (text.length > 0) {
					return this.seek_hint(text, ADJS, 1, true, '@');
				}
			}
			else {
				if (text.charAt(text.length - 1) != '@') {
					var parts = text.split('@', 2);
					var bef = parts[0];
					var aft = parts[1];

					if (aft.indexOf('.') == -1) {
						this.trigger('state', 'incomplete');
						return this.seek_hint(aft, DOMS, 1, true, '.');
					}
					else {
						var tmp = aft.split('.', 2);
						var host = tmp[0];
						var ext = tmp[1];

						if (aft.charAt(aft.length - 1) !== '.') {
							if (ext.length > 2) {
								this.trigger('state', 'complete');
							}
							else {
								this.trigger('state', 'partial');
								return this.seek_hint(ext, EXTS, 1, true);
							}
						}
						else {
							// no hint
						}

						// no hint
					}
				}
				else {
					// no hint
				}
			}

			// no hint
			return '';
		},

		autocomplete: function(value, text, length) {
			var res = this.apply_rules();
			//if (!.test(local)) {
		},

		run : function(module, value, text) {
			var rule = {
				name: 'the email',
				minlength: 2,
				maxlength: 255,
				rules: [
					{
						name: 'account name',
						pattern: /^[a-zA-Z0-9!#$%&\'*+\/=?^_`{|}~\.-]+$/i,
						hints : module.options.list_accounts,
						minlength: 0,
						maxlength: 255
					},
					'@',
					{
						name: 'server name',
						pattern : /^[a-z0-9-]+$/i,
						hints : module.options.list_hosts,
						minlength: 1,
						maxlength: 3
					},
					'.',
					{
						name: 'extension',
						example: '.com, .net, .org, .fr, etc',
						pattern : /^[a-z0-9-]+$/i,
						hints : module.options.list_tlds,
						minlength: 1,
						maxlength: 3
					}
				]
			};

			if (text.length < 2) {
				// no completion yet...
				this.trigger('state','incomplete');
			}

			// complete with "best guesses" (or "motivationnal" words)
			if (text.indexOf('@') == -1) {
				if (text.length > 0) {
					return this.seek_hint(text, rule.rules[0].hints, 1, true, '@');
				}
			}
			else {
				if (text.charAt(text.length - 1) != '@') {
					var parts = text.split('@', 2);
					var bef = parts[0];
					var aft = parts[1];

					if (aft.indexOf('.') == -1) {
						this.trigger('state', 'incomplete');
						return this.seek_hint(aft, rule.rules[2].hints, 1, true, '.');
					}
					else {
						var tmp = aft.split('.', 2);
						var host = tmp[0];
						var ext = tmp[1];

						if (aft.charAt(aft.length - 1) !== '.') {
							if (ext.length > 2) {
								this.trigger('state', 'complete');
							}
							else {
								this.trigger('state', 'partial');
								return this.seek_hint(ext, rule.rules[4].hints, 1, true);
							}
						}
						else {
							// no hint
						}

						// no hint
					}
				}
				else {
					// no hint
				}
			}

			// no hint
			return '';
		}
	};

	function inputMagic(element, options) {
		this.options = $.extend({}, this.defaults, options);
		this.element = element;
		this.$ = $(element);
		this.completor;
		this.init();
	}

	inputMagic.prototype = {
		defaults : {
			// not yet defined...
		},

		init : function() {
			var it = this;

			// instantiate appropriate completion module
			var type = this.$.data('type'),
				module = this.modules[type] || null;

			if (module) this.completor = module;
			else this.trigger('error', 'cannot find module for type '+ type);

			this.$.keydown(function(e){
				var keycode = (e.keyCode ? e.keyCode : e.which);
				var show_hint = false;
				var now = +new Date();

				// typing text
				if (!it.firstpress) it.firstpress = now;
				it.lastpress = now;

				// codes ref : http://www.quirksmode.org/js/keys.html
				console.log("pressing "+ keycode);

				if (keycode == 13) {
					// enter pressed : submit value (?)
					log.console('enter pressed... submit?');

					this.data('hint', '');
				}
				else if (keycode == 8 || keycode == 46) {
					// backspace or suppr : show hint that got deleted (?)
				}
				else if (keycode < 32) {
					// non-printable character : clear hint
					this.data('hint', '');
				}
				else if (keycode >= 33 && keycode <= 40) {
					// arrows keys (home, end, pgup, pgdwn, etc) : clear hint
					this.data('hint', '');
					show_hint = true;
				}
				else {
					// printable characters : show hint
					show_hint = true;
				}

				if (show_hint) {// display hint as requested
					setTimeout(function(){it.autocomplete()}, 10);
				}
			});
		},

		range : function(start, end) {
			if (this.element.createTextRange) {
				var range = this.element.createTextRange();
				range.collapse(true);
				range.moveStart('character', start);
				range.moveEnd('character', end);
				range.select();
			}
			else if (this.element.setSelectionRange) {
				this.element.setSelectionRange(start, end);
			}
		},

		append_hint : function(hint) {
			var text = trim(this.element.value, noregex(hint));

			this.$.val(text + hint);
			this.$.data('hint', hint);
			this.range(text.length, text.length + hint.length);
		},

		seek_hint : function(str, suggest_arr, max_results, offset, suffix) {
			var results = [];
			if (max_results === undefined) max_results = 1;
			if (suffix === undefined) suffix = '';

			for (var i=0; i<suggest_arr.length; i++) {
				if (results < max_results) {
					if (suggest_arr[i].substring(0, str.length) == str) {
						results.push(offset? suggest_arr[i].substr(str.length) + suffix : suggest_arr[i] + suffix);
					}
				}
				else break;
			}

			// return array or single value
			if (results.length == 0) {
				// no match found
				return (max_results == 1) ? suffix : [suffix];
			}
			else {
				// found a match (or more)
				return (max_results == 1) ? results[0] : results;
			}
		},

		autocomplete : function() {
			var value = this.$.val(),
				text = trim(value, noregex(this.$.data('hint'))),
				hint = '';

			if (this.completor) {
				hint = this.completor.run.call(this, this.completor, value, text);

				if (hint.length > 0) {
					// only suggest non-empty strings
					this.append_hint(hint);
				}
				else {
					this.$.data('hint', '');
				}
			}
		},

		trigger : function(eventtype, data) {
			$(this.element).trigger('input'+ eventtype, data);
		},

		modules : {
			'email' : new inputMagicEmailModule()
		}
	};

	$.fn.inputMagic = function(options) {
		return this.each(function() {
			if (!$.data(this, 'inputMagic')) {
				$.data(this, 'inputMagic', new inputMagic(this, options));
			}
		});
	}

})(jQuery, window, document);
