/*
	InputMagic v0.1.0
	https://github.com/ideasmashup/input-magic

	By William ANGER, ISC License, July 2014
*/

(function($, window, document, undefined){

	var $input = null;
	var firstpress = -1, lastpress = +new Date(), typespeed = -1, count = 0;

	// Create the defaults once
	var pluginName = 'inputMagic', defaults = {
		propertyName : "value"
	};

	// The actual plugin constructor
	function Plugin(element, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options);

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	Plugin.prototype.init = function() {
		// Place initialization logic here
		// this.element
		// this.options

		var $elt = $(this.element);
		var enable_autocomplete = false;

		$elt.keydown(function(e){
			var keycode = (e.keyCode ? e.keyCode : e.which);
			var now = +new Date();

			// typing text
			if (count++ == 0) {
				firstpress = now;
				typespeed = 3000;
			}
			else {
				lastpress = now;
				typespeed = (typespeed + (now - lastpress)) / 2;
			}

			// codes ref : http://www.quirksmode.org/js/keys.html
			console.log("pressing "+ keycode);

			if (keycode == 13) {
				// enter pressed : submit value (?)
				log.console('enter pressed... submit?');

				$elt.data('hint', '');
				enable_autocomplete = false;
			}
			else if (keycode == 8 || keycode == 46) {
				// backspace or suppr : show hint again
				enable_autocomplete = false;
			}
			else if (keycode < 32) {
				// non-printable character : clear hint
				$elt.data('hint', '');
				enable_autocomplete = false;
			}
			else if (keycode >= 33 && keycode <= 40) {
				// arrows keys (home, end, pgup, pgdwn, etc) : clear hint
				$elt.data('hint', '');
				enable_autocomplete = true;
			}
			else {
				// printable characters : typing text so stop checking
				enable_autocomplete = true;
			}

			if (enable_autocomplete) {
				// do autocomplete
				setTimeout(function(){email_range_autocomplete($elt)}, 10);
				enable_autocomplete = false;
			}
		});
	};

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function(options) {
		return this
			.each(function() {
				if (!$.data(this, 'plugin_' + pluginName)) {
					$.data(this, 'plugin_' + pluginName, new Plugin(this,
							options));
				}
			});
	}

	// @Bobince:
	// http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
	function RegExp_escape(str) {
		return (str !== undefined)? str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : '';
	}

	if (!String.prototype.trim) {
		String.prototype.trim = function (pattern) {
			if (pattern == undefined) pattern = /^\s+|\s+$/g;
			return this.replace(pattern, ''); //"\t\n\r\0\x0B."
		};
	}

	if (!String.prototype.remove) {
		String.prototype.remove = function(str) {
			var re = (typeof str == 'string')? str : new RegExp(str, 'g');
			return this.replace(re, '');
		};
	}

	if (!String.prototype.localeCompare) {
		String.prototype.localeCompare = function(str, locale, options) {
			return ((this == str) ? 0 : ((this > str) ? 1 : -1));
		};
	}

	//special post-keypress behaviors
	function after_keypress() {

		// do nothing until user types more stuff
		//if (lastpress == firstpress) return;

		var pausedelay = +new Date() - lastpress;
		//console.log('paused for '+ pausedelay);

		if (pausedelay < 500) {
			// last keypress very close : do nothing
			// because user is probably still typing stuff...

			// interrupt tasks
		}
		else if (pausedelay > 1000) {
			// last keypress was long ago
			// check email harder with a server validation request

			// indicate task in progress

			// animate avatar
			state = 'hey';
			loops = 0;
		}
		else {
			// last keypress moderately close
			// user not typing but may type again soon...
		}

		// do some basic autocompletion and checking
		email_range_autocomplete($input);
	}
	/*
		Validation state
	 */

	function state_change(state) {
		console.log('state_change = '+ state);
	}

	function input_state(name, state, completeness) {
		var $input = $('input{name='+name+']');
		
	}

	/*
		Form handling
	*/

	function caret($input, value) {
		var input = $input.get();
		var pos = 0;

		$input.focus();

		if (value === undefined) {
			// fetch caret position

			if (input.createTextRange) {
				var range = document.selection.createRange();
				range.moveStart('character', -$input.val().length);
				pos = range.text.length;
			}
			else if (input.selectionStart !== undefined) {
				pos = input.selectionStart;
			}

			return pos;
		}
		else {
			// set caret position
			range_create($input, value, value);
		}
	}

	function range_create($input, start, end) {
		var input = $input[0];

		if (input.createTextRange) {
			var range = input.createTextRange();
			range.collapse(true);
			range.moveStart('character', start);
			range.moveEnd('character', end);
			range.select();
		}
		else if (input.setSelectionRange) {
			input.setSelectionRange(start, end);
		}
	}

	function range_append_hint($input, hint) {
		var input = $input.get();
		var text = $input.val().trim(RegExp_escape(hint));

		$input.val(text + hint);
		$input.data('hint', hint);
		range_create($input, text.length, text.length + hint.length);
	}

	function complete(str, suggest_arr, max_results, offset, suffix) {
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
	}

	function email_range_autocomplete($input) {
		var value = $input.val();
		var text = value.trim(RegExp_escape($input.data('hint')));
		var len = text.length;
		var hint = '';
		var completeness = Math.min(text.length / 14, 1);

		var ADJS = ['amazing','blithesome','charismatic','decisive','excellent','fantastical','great','heroic','incredible','jolly','kickstarter','light','magical','nice','outstanding','perfect','quality','remarkable','smart','thrilling','ultimate','vibrant','wondrous','xylophone','yes_we_can','zippy'];
		var DOMS = ['hotmail','live','yahoo','gmail','orange','aol','free','numericable'];
		var EXTS = ['com','fr','eu','org','us','net','io'];

		console.log('input='+ text +' ( '+ (completeness*100) +'% )');

		if (text.length < 2) {
			// no completion yet...
			state_change('incomplete');
		}

		// complete with "best guesses" (or "motivationnal" words)
		if (text.indexOf('@') == -1) {
			if (text.length > 0) {
				hint = complete(text, ADJS, 1, true, '@');
			}
		}
		else {
			if (text.charAt(text.length - 1) != '@') {
				var parts = text.split('@', 2);
				var bef = parts[0];
				var aft = parts[1];

				if (aft.indexOf('.') == -1) {
					hint = complete(aft, DOMS, 1, true, '.');
					state_change('incomplete');
				}
				else {
					var tmp = aft.split('.', 2);
					var host = tmp[0];
					var ext = tmp[1];

					if (aft.charAt(aft.length - 1) !== '.') {
						if (ext.length > 2) {
							state_change('complete');
						}
						else {
							hint = complete(ext, EXTS, 1, true);
							state_change('partial');
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

		if (hint.length > 0) {
			// only suggest non-empty strings
			range_append_hint($input, hint);
		}
		else {
			$input.data('hint', '');
		}
	}

	function is_email(email) {
		// Test for the minimum length the email can be
		if (email.length < 3) {
			console.log('email_too_short');
			return false;
		}

		// Test for an @ character after the first position
		if (email.indexOf('@', 1) === -1) {
			console.log('email_no_at');
			return false;
		}

		// Split out the local and domain parts
		var parts = email.split('@', 2);
		var local = parts[0];
		var domain = parts[1];

		// LOCAL PART
		// Test for invalid characters
		if (!new RegExp('^[a-zA-Z0-9!#$%&\'*+\/=?^_`{|}~\.-]+$').test(local)) {
			console.log('local_invalid_chars');
			return false;
		}

		// DOMAIN PART
		// Test for sequences of periods
		if (new RegExp('\\.{2,}').exec(domain) !== null) {
			console.log('domain_period_sequence '+ new RegExp('\\.{2,}').exec(domain).toSource());
			return false;
		}

		// Test for leading and trailing periods and whitespace
		if (domain.trim() !== domain) {
			console.log('domain_period_limits');
			return false;
		}

		// Split the domain into subs
		var subs = domain.split('.');

		// Assume the domain will have at least two subs
		if (subs.length < 2) {
			console.log('domain_no_periods');
			return false;
		}

		// Loop through each sub
		for (sub in subs) {
			// Test for leading and trailing hyphens and whitespace
			if (sub.trim() !== sub) {
				console.log('sub_hyphen_limits');
				return false;
			}

			// Test for invalid characters
			if (!new RegExp('^[a-z0-9-]+$', 'i').test(sub)) {
				console.log('sub_invalid_chars');
				return false;
			}
		}

		// Congratulations your email made it!
		console.log('valid_email');
		return true;
	}

	function email_deep_check(str) {
		// validate and verify on server
	}

})(jQuery, window, document);
