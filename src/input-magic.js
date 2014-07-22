/*
 * Input Magic v0.1.0
 * 
 * Copyright (c) 2014, William ANGER <input-magic at william-anger.com>
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */
/*
	Native types extensions
*/

// @Bobince: http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
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

/*
	Validation state
 */

var COLOR_HEX_DEFAULT = '#2BA3D4';
var COLOR_HEX_CHECK00 = '#a470d0';
var COLOR_HEX_CHECK30 = '#7087d0';
var COLOR_HEX_CHECK60 = '#70b4d0';
var COLOR_HEX_CHECK90 = '#70d0b9';
var COLOR_HEX_WARNING = '#d07070'; //'#BB2324';
var COLOR_HEX_SUCCESS = '#a9d42b'; //'#88BB33';

function color_switch(color) {
	$('.message').css({
		'color' : color,
		'border-color' : color,
	});
}

function input_state(name, state, completeness) {
	var $input = $('input{name='+name+']');
	
}

/*
	Form handling
*/

function ajax_forms(callback){
	$('form').on('submit', function(e) {
		e.preventDefault();

		var $form = $(this);

		$.ajax({
			url: $form.attr('action'),
			type: $form.attr('method'),
			data: $form.serialize(),
			success: function(resp) {
				callback($form, resp);
			}
		});
	});
}

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

function range_autocomplete($input) {
	// complete only when caret is at value end

}


/*
	Email processing
*/

function cmp_str(a, b) {
	return a.localCompare(b);
}

var ADJS = ['amazing','blithesome','charismatic','decisive','excellent',
            'fantastical','great','heroic','incredible','jolly','kickstarter',
            'light','magical','nice','outstanding','perfect','quality',
            'remarkable','smart','thrilling','ultimate','vibrant','wondrous','xylophone','yes_we_can','zippy'];
var DOMS = ['hotmail','live','yahoo','gmail','orange','aol','free','numericable'];
var EXTS = ['com','fr','eu','org','us','net','io'];

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

	console.log('mail='+ text +' ( '+ (completeness*100) +'% )');

	if (text.length < 2) {
		// no completion yet...
		$('#btsubmit').text('Complete the e-mail to continue!').attr('disabled', 'disabled');
		color_switch(COLOR_HEX_DEFAULT);
	}

	// complete with "best guesses" (or "motivationnal" words)
	if (text.indexOf('@') == -1) {
		if (text.length > 0) {
			hint = complete(text, ADJS, 1, true, '@');
			$('#btsubmit').text('Who "at" you?').attr('disabled', 'disabled');
		}
	}
	else {
		if (text.charAt(text.length - 1) != '@') {
			var parts = text.split('@', 2);
			var bef = parts[0];
			var aft = parts[1];

			if (aft.indexOf('.') == -1) {
				hint = complete(aft, DOMS, 1, true, '.');
				$('#btsubmit').text('Where "at" you from?').attr('disabled', 'disabled');
				color_switch(COLOR_HEX_CHECK30);
			}
			else {
				var tmp = aft.split('.', 2);
				var host = tmp[0];
				var ext = tmp[1];

				if (aft.charAt(aft.length - 1) !== '.') {
					if (ext.length > 2) {
						$('#btsubmit').text('Click here to receive your invite!!').removeAttr('disabled').transition('pulse');
						color_switch(COLOR_HEX_CHECK90);
					}
					else {
						hint = complete(ext, EXTS, 1, true);
						color_switch(COLOR_HEX_CHECK60);
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

function email_subscribe() {
	// submit mail if address is complete and correct
	$.ajax({
		url: 'process.php?action=subscribe',
		type: 'post',
		data: $('#email').serialize(),
		success: function(resp) {
			if (resp.success) {
				$('#message.quartz').transition('pulse');

				// user now registered !
				$('#msg_icon').attr('class', 'checkmark icon');
				$('#msg_text').text("You've been successfully registered... please confirm the email you will receive in your mailbox!");
				$('#msg_header').text('Congratulations!');

				color_switch(COLOR_HEX_SUCCESS);

				$('.ui.reveal.quartz').removeClass('move');
				$('#btsubmit').removeAttr('disabled').attr('data-completed', true).text('Click here to visit the blog');
			}
			else {
				$('#message.quartz').transition('shake');

				// error
				if (resp.view == 'already_registered') {
					$('#msg_icon').attr('class', 'thumbs up outline icon');
					$('#msg_text').text("You\'ve already registered! Thank you for your support!");
					$('#msg_header').text('Welcome back!');

					color_switch(COLOR_HEX_SUCCESS);

					$('.ui.reveal.quartz').removeClass('move');
					$('#btsubmit').removeAttr('disabled').attr('data-completed', true).text('Click here to visit the blog');
				}
				else if (resp.view == 'registration_failed') {
					$('#msg_icon').attr('class', 'icon coffee');
					$('#msg_text').text("You couldn't be registered, grab some coffee and try again later");//"+resp.data+"!");

					switch (resp.data) {
						default:
							$('#msg_header').text('Something went wrong');
							break;
						case 'frontend_account_error':
							$('#msg_header').text('Huh hoh, too much traffic');
							break;
						case 'backend_account_error':
							$('#msg_header').text('Timmo\'s done it again!');
							break;
						case 'mailinglist_subscribe_error':
							$('#msg_header').text('A monkey escaped!');
							break;
					}

					color_switch(COLOR_HEX_WARNING);
				}
				else if (resp.view == 'incorrect_mail') {
					$('#msg_icon').attr('class', 'lab icon');
					$('#msg_text').text("There must be a typo in your e-mail, because this one doesn't look right!");
					$('#msg_header').text('Mail hazard detected');

					color_switch(COLOR_HEX_CHECK30);
				}
				else {
					$('#msg_icon').attr('class', 'icon warning');
					$('#msg_text').text("You couldn't be registered due to "+resp.data+"!");
					$('#msg_header').text('Something went wrong');

					color_switch(COLOR_HEX_CHECK10);
				}
			}
		}
	});

	state = 'hey';
	statelocked = true;
}

function email_deep_check(str) {
	// validate and verify on server
}
