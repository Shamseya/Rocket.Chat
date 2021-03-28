import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../../../ui-utils/client';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'discussion-created',
		system: false,
		message: 'discussion-created',
		data(message) {
			return {
				message: `<svg class="rc-icon" aria-hidden="true"><use xlink:href="#icon-patient-add"></use></svg> ${ message.msg }`,
			};
		},
	});
});
