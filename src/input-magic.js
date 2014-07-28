/*
	InputMagic v0.1.0
	https://github.com/ideasmashup/input-magic

	By William ANGER, ISC License, July 2014
*/

(function($, window, document, undefined){

	var $input = null;
	var firstpress = -1, lastpress = +new Date(), count = 0;

	function inputMagic(element, options) {
		this.options = $.extend({}, this.defaults, options);
		this.element = element;
		this.init();
	}

	inputMagic.prototype = {
		defaults : {
			// not yet defined...
		},

		init : function() {
			var $elt = $(this.element);
			var enable_autocomplete = false;
			var im = this;
	
			$elt.keydown(function(e){
				var keycode = (e.keyCode ? e.keyCode : e.which);
				var now = +new Date();
	
				// typing text
				if (count++ == 0) firstpress = now;
				lastpress = now;
	
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
					setTimeout(function(){im.email_range_autocomplete($elt)}, 10);
					enable_autocomplete = false;
				}
			});
		},
		
		/*
			Form handling
		*/
	
		range_create : function($input, start, end) {
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
		},
	
		range_append_hint : function($input, hint) {
			var input = $input.get();
			var text = trim($input.val(), noregex(hint));
	
			$input.val(text + hint);
			$input.data('hint', hint);
			this.range_create($input, text.length, text.length + hint.length);
		},
	
		complete : function(str, suggest_arr, max_results, offset, suffix) {
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
	
		email_range_autocomplete : function($input) {
			var value = $input.val();
			var text = trim(value, noregex($input.data('hint')));
			var len = text.length;
			var hint = '';
			var completeness = Math.min(text.length / 14, 1);
	
			var ADJS = ['amazing','blithesome','charismatic','decisive','excellent','fantastical','great','heroic','incredible','jolly','kickstarter','light','magical','nice','outstanding','perfect','quality','remarkable','smart','thrilling','ultimate','vibrant','wondrous','xylophone','yes_we_can','zippy'];
			var DOMS = ['hotmail','live','yahoo','gmail','orange','aol','free','numericable'];
			var EXTS = ['com','fr','eu','org','us','net','io'];
	
			console.log('input='+ text +' ( '+ (completeness*100) +'% )');
	
			if (text.length < 2) {
				// no completion yet...
				this.trigger('state','incomplete');
			}
	
			// complete with "best guesses" (or "motivationnal" words)
			if (text.indexOf('@') == -1) {
				if (text.length > 0) {
					hint = this.complete(text, ADJS, 1, true, '@');
				}
			}
			else {
				if (text.charAt(text.length - 1) != '@') {
					var parts = text.split('@', 2);
					var bef = parts[0];
					var aft = parts[1];
	
					if (aft.indexOf('.') == -1) {
						hint = this.complete(aft, DOMS, 1, true, '.');
						this.trigger('state', 'incomplete');
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
								hint = this.complete(ext, EXTS, 1, true);
								this.trigger('state', 'partial');
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
				this.range_append_hint($input, hint);
			}
			else {
				$input.data('hint', '');
			}
		},

		trigger : function(eventtype, data) {
			$.trigger('input'+ eventtype, data);
		}
	};

	$.fn.inputMagic = function(options) {
		return this.each(function() {
			if (!$.data(this, 'inputMagic')) {
				$.data(this, 'inputMagic', new inputMagic(this, options));
			}
		});
	}

	// @Bobince:
	// http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
	function noregex(str) {
		return str ? str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') : '';
	}

	function trim(str, pattern) {
		return str.replace(pattern || /^\s+|\s+$/g, ''); //"\t\n\r\0\x0B."
	}

})(jQuery, window, document);
