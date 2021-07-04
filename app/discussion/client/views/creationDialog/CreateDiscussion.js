import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';

import { roomTypes } from '../../../../utils/client';
import { callbacks } from '../../../../callbacks/client';
import { ChatRoom, ChatSubscription } from '../../../../models/client';
import { call } from '../../../../ui-utils/client';
import { AutoComplete } from '../../../../meteor-autocomplete/client';

import './CreateDiscussion.html';
import { allFacilities } from './AllFacilities';
import { allInvestigations } from './AllInvestigations';
import { allDevices } from './AllDevices';


Template.CreateDiscussion.helpers({
	encrypted() {
		return Template.instance().encrypted.get();
	},
	onSelectUser() {
		return Template.instance().onSelectUser;
	},
	messageDisable() {
		if (Template.instance().encrypted.get()) {
			return 'disabled';
		}
	},
	disabled() {
		if (Template.instance().selectParent.get()) {
			return 'disabled';
		}
	},
	targetChannelText() {
		const instance = Template.instance();
		const parentChannel = instance.parentChannel.get();
		return parentChannel && `${ TAPi18n.__('Discussion_target_channel_prefix') } "${ parentChannel }"`;
	},
	createIsDisabled() {
		const { parentChannel, 
			patientName, patientID, patientDateOfBirth, 
			serviceType, 
			otherServiceTypeInvestigation,
			referringDoctor, eye, selectedFacility, selectedInvestigations, 
			zoomRoomType, 
			customZoomRoomLink, 
			selectedUsers
		} = Template.instance();
		// if (!parentChannel.get()  || !selectedUsers.get()?.length) return 'disabled';
		// Basic Custom Data
		if (!patientName.get()?.trim() /*|| !patientID.get()?.trim() || !patientDateOfBirth.get()?.trim()*/) return 'disabled';


		// ////// Serice Type not set
		// if(!serviceType.get()) return 'disabled';

		// // Service Type is other && custom Innvestigation => Correct
		// if (serviceType.get() === "other") {
		// 	if(otherServiceTypeInvestigation.get()?.trim()) {
		// 		return '';
		// 	} else {
		// 		return 'disabled';
		// 	}
		// }
		// ////// Service Type is ophthalmology
		// // Basic ophthalmology fields
		// if(!referringDoctor.get()?.trim() || !eye.get()?.trim() || !selectedFacility.get() || !selectedInvestigations.get()?.length === 0) return 'disabled';

		// selectedInvestigations.get()?.forEach((inv) => {
		// 	if(!inv.investigation.name || !inv.device) {
		// 		return 'disabled'
		// 	}
		// });

		// //// Zoon Room type is set
		// if(!zoomRoomType.get()) return 'disabled';
		// // Zoom room type is standard, facility's zoomlink
		// if(zoomRoomType.get()?.trim() === "standard" && !selectedFacility.get()?.zoomLink?.trim()) return 'disabled';
		// // Zoom room type is custom, custom zoomlink
		// if(zoomRoomType.get()?.trim() === "custom" && !customZoomRoomLink.get()?.trim()) return 'disabled';


		// // All pass => Correct
		return '';
	},
	parentChannel() {
		const instance = Template.instance();
		return instance.parentChannel.get();
	},
	selectedUsers() {
		const myUsername = Meteor.user().username;
		const { message } = this;
		const users = Template.instance().selectedUsers.get()?.map((e) => e);
		if (message) {
			users.unshift(message.u);
		}
		return users.filter(({ username }) => myUsername !== username);
	},

	onClickTagUser() {
		return Template.instance().onClickTagUser;
	},
	deleteLastItemUser() {
		return Template.instance().deleteLastItemUser;
	},
	onClickTagRoom() {
		return Template.instance().onClickTagRoom;
	},
	deleteLastItemRoom() {
		return Template.instance().deleteLastItemRoom;
	},
	selectedRoom() {
		return Template.instance().selectedRoom.get();
	},
	onSelectRoom() {
		return Template.instance().onSelectRoom;
	},
	roomCollection() {
		return ChatRoom;
	},
	roomSelector() {
		return (expression) => ({ name: { $regex: `.*${ expression }.*` } });
	},
	roomModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `#${ f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	userModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	nameSuggestion() {
		return Template.instance().discussionName.get();
	},
	otherSelected() {
		return Template.instance().serviceType.get() === "other";
	},
	ophthalmologySelected() {
		return Template.instance().serviceType.get() === "ophthalmology";
	},
	referringDoctor() {
		return Template.instance().referringDoctor.get();
	},
	isLeftEye() {
		return Template.instance().eye.get() === "left";		
	},
	isRightEye() {
		return Template.instance().eye.get() === "right";		
	},
	isBothEyes() {
		return Template.instance().eye.get() === "both";		
	},
	allFacilities() {
		return Template.instance().facilities.get();
	},
	selectedFacility() {
		return Template.instance().selectedFacility.get();
	},
	allInvestigations() {
		return Template.instance().investigations.get();
	},
	isOnlyInesvtigation() {
		return Template.instance().selectedInvestigations.get()?.length === 1;
	},
	selectedInvestigations() {
		return Template.instance().selectedInvestigations.get();
	},
	allDevices() {
		return Template.instance().devices.get();
	},
	standardZoomRoomSelected() {
		return Template.instance().zoomRoomType.get() === "standard";
	},
	customZoomRoomSelected() {
		return Template.instance().zoomRoomType.get() === "custom";
	},
	customZoomRoomLink() {
		return Template.instance().customZoomRoomLink.get();
	},


	otherServiceTypeInvestigation() {
		return Template.instance().otherServiceTypeInvestigation.get()
	}
});

Template.CreateDiscussion.events({
	'input #discussion_name'(e, t) {
		t.discussionName.set(e.target.value);
	},
	'input #encrypted'(e, t) {
		t.encrypted.set(!t.encrypted.get());
	},
	'input #discussion_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},
	'input #service-type-radio-buttons'(e,t) {
		t.serviceType.set(e.target.value);
	},
	'input #patientName'(e,t) {
		t.patientName.set(e.target.value);
	},
	'input #patientID'(e,t) {
		t.patientID.set(e.target.value);
	},
	'input #patientDateOfBirth'(e,t) {
		t.patientDateOfBirth.set(e.target.value);
	},
	'input #referring-doctor'(e,t) {
		t.referringDoctor.set(e.target.value);
	},
	'input #eye-radio-buttons'(e,t) {
		t.eye.set(e.target.value);
	},
	'input #facility-select'(e,t) {
		t.selectedFacility.set(t.facilities.curValue[parseInt(e.target.options.selectedIndex) - 1 ]);
	},
	'input #investigation-select'(e,t) {
		let investigation = t.investigations.curValue.find(investigation => investigation.name === e.target.value);
		let newInvestigations = [...t.selectedInvestigations.get()];
		newInvestigations[parseInt(e.target.name)].investigation = investigation;
		let automaticAnyDesk = Template.instance().devices.get()?.find
			(
				device => device.facilityName === Template.instance().selectedFacility.get()?.name &&
				device.investigation === newInvestigations[e.target.name].investigation.name
			)
		newInvestigations[parseInt(e.target.name)].device = automaticAnyDesk.anydeskDeviceName;			
		t.selectedInvestigations.set(newInvestigations);
	},
	'input #zoom-room-radio-buttons'(e,t) {
		t.zoomRoomType.set(e.target.value);
	},
	'input #custom-zoom-room-link'(e,t) {
		t.customZoomRoomLink.set(e.target.value);
	},

	'input #anydesk-device-type-radio-buttons'(e,t) {
		let newInvestigations = [...t.selectedInvestigations.get()];
		if(e.target.value === 'automatic') {

			let automaticAnyDesk = Template.instance().devices.get()?.find
			(
				device => device.facilityName === Template.instance().selectedFacility.get()?.name &&
				device.investigation === newInvestigations[e.target.name].investigation.name
			)
			newInvestigations[parseInt(e.target.name)].device = automaticAnyDesk.anydeskDeviceName;
			newInvestigations[parseInt(e.target.name)].automatic = true;
			newInvestigations[parseInt(e.target.name)].custom = false;
		}
		else {
			newInvestigations[parseInt(e.target.name)].automatic = false;
			newInvestigations[parseInt(e.target.name)].custom = true;
		}
		t.selectedInvestigations.set(newInvestigations);
	},

	'input #custom-anydesk-device-name'(e,t) {
		let investigation = t.investigations.curValue.find(investigation => investigation.name === e.target.value);
		let newInvestigations = [...t.selectedInvestigations.get()];
		newInvestigations[parseInt(e.target.name)].device = e.target.value;
		t.selectedInvestigations.set(newInvestigations);
	},

	'input #other-service-type-investigation'(e,t) {
		t.otherServiceTypeInvestigation.set(e.target.value);
	},

	'click #add-investigation'(e,t) {
		let newInvestigations = [...t.selectedInvestigations.get()];
		let emptyInvestigation = {investigation: '', device: '', automatic: true, custom: false };
		newInvestigations.push(emptyInvestigation);
		t.selectedInvestigations.set(newInvestigations);
	},

	'click #remove-investigation'(e,t) {
		let newInvestigations = [...t.selectedInvestigations.get()];
		if(newInvestigations.length === 1) return;
		newInvestigations.splice(parseInt(e.target.name),1);
		t.selectedInvestigations.set(newInvestigations);
	},

	async 'submit #create-discussion, click .js-save-discussion'(event, instance) {

		event.preventDefault();
		const parentChannel = instance.parentChannel.get();

		const { pmid } = instance;
		const t_name = instance.patientName.get();
		const users = instance.selectedUsers.get()?.map(({ username }) => username).filter((value, index, self) => self.indexOf(value) === index);
		const encrypted = instance.encrypted.get();

		const prid = instance.parentChannelId.get();
		const reply = encrypted ? undefined : instance.reply.get();

		const {patientName, patientID, patientDateOfBirth, serviceType } = instance;
		const data = {};
		data.patientName= patientName.get();
		data.patientID= patientID.get();
		data.patientDateOfBirth= patientDateOfBirth.get();
		data.serviceType= serviceType.get();
		if(serviceType === 'other') {
			data.otherServiceTypeInvestigation = instance.otherServiceTypeInvestigation.get();
		}
		else {
			const {referringDoctor, eye, selectedFacility, selectedInvestigations, zoomRoomType, anydeskDeviceType } = instance;
			data.referringDoctor = referringDoctor.get();
			data.eye = eye.get();
			data.selectedFacility = selectedFacility.get();
			data.selectedInvestigations = selectedInvestigations.get();
			data.zoomRoomType = zoomRoomType.get();
			if(zoomRoomType.get() === "standard") {
				data.zoomRoomLink = instance.selectedFacility.get()?.zoomLink;
			}
			else {
				data.zoomRoomLink = instance.customZoomRoomLink.get();
			}
		}
	
	
		if (!prid) {
			const errorText = TAPi18n.__('Invalid_room_name', `${ parentChannel }...`);
			return toastr.error(errorText);
		}
		const result = await call('createDiscussion', { prid, pmid, t_name, users, encrypted, reply, data });

		// callback to enable tracking
		callbacks.run('afterDiscussion', Meteor.user(), result);

		if (instance.data.onCreate) {
			instance.data.onCreate(result);
		}

		roomTypes.openRouteLink(result.t, result);
	},
});

Template.CreateDiscussion.onRendered(function() {
	this.find(this.data.rid ? '#patientName' : '#parentChannel').focus();
});

const suggestName = (msg = '') => msg.substr(0, 140);


Template.CreateDiscussion.onCreated(function() {
	const { rid, message: msg } = this.data;

	const parentRoom = rid && ChatSubscription.findOne({ rid });

	// if creating a discussion from inside a discussion, uses the same channel as parent channel
	const room = parentRoom && parentRoom.prid ? ChatSubscription.findOne({ rid: parentRoom.prid }) : parentRoom;

	if (room) {
		room.text = room.name;
	}

	const roomName = room && roomTypes.getRoomName(room.t, room);
	this.discussionName = new ReactiveVar(suggestName(msg && msg.msg));

	this.serviceType =new ReactiveVar('ophthalmology')

	this.patientName = new ReactiveVar('');
	this.patientID = new ReactiveVar('');
	this.patientDateOfBirth = new ReactiveVar('');
	this.referringDoctor = new ReactiveVar('');
	this.eye = new ReactiveVar('');

	this.facilities = new ReactiveVar(allFacilities)
	this.selectedFacility = new ReactiveVar(null)
	this.investigations = new ReactiveVar(allInvestigations)

	this.selectedInvestigations = new ReactiveVar([{investigation: '', device: '', automatic: true, custom: false }])
	this.devices = new ReactiveVar(allDevices)

	this.zoomRoomType=new ReactiveVar('standard');
	this.customZoomRoomLink=new ReactiveVar('');


	this.otherServiceTypeInvestigation = new ReactiveVar('')

	this.pmid = msg && msg._id;

	this.encrypted = new ReactiveVar(room?.encrypted || false);
	this.parentChannel = new ReactiveVar(roomName);
	this.parentChannelId = new ReactiveVar(room && room.rid);

	this.selectParent = new ReactiveVar(room && room.rid);

	this.reply = new ReactiveVar('');

	this.selectedRoom = new ReactiveVar(room ? [room] : []);

	this.onClickTagRoom = () => {
		this.selectedRoom.set([]);
	};
	this.deleteLastItemRoom = () => {
		this.selectedRoom.set([]);
	};

	this.onSelectRoom = ({ item: room }) => {
		room.text = room.name;
		this.selectedRoom.set([room]);
	};

	this.autorun(() => {
		const [room = {}] = this.selectedRoom.get();
		this.parentChannel.set(roomTypes.getRoomName(room.t, room)); // determine parent Channel from setting and allow to overwrite
		this.parentChannelId.set(room && (room.rid || room._id));
	});

	this.selectedUsers = new ReactiveVar([]);
	this.onSelectUser = ({ item: user }) => {
		if (user.username === (msg && msg.u.username)) {
			return;
		}

		if (user.username === Meteor.user().username) {
			return;
		}
		const users = this.selectedUsers.get();
		if (!users.find((u) => user.username === u.username)) {
			this.selectedUsers.set([...users, user]);
		}
	};
	this.onClickTagUser = ({ username }) => {
		this.selectedUsers.set(this.selectedUsers.get()?.filter((user) => user.username !== username));
	};
	this.deleteLastItemUser = () => {
		const arr = this.selectedUsers.get();
		arr.pop();
		this.selectedUsers.set(arr);
	};

	// callback to allow setting a parent Channel or e. g. tracking the event using Piwik or GA
	const { parentChannel, reply } = callbacks.run('openDiscussionCreationScreen') || {};

	if (parentChannel) {
		this.parentChannel.set(parentChannel);
	}
	if (reply) {
		this.reply.set(reply);
	}
});

Template.SearchCreateDiscussion.helpers({
	list() {
		return this.list;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const { filter } = Template.instance();
		const { noMatchTemplate, templateItem, modifier } = Template.instance().data;
		return {
			filter: filter.get(),
			template_item: templateItem,
			noMatchTemplate,
			modifier(text) {
				return modifier(filter, text);
			},
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
});

Template.SearchCreateDiscussion.events({
	'input input'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.filter.set(input.value);
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown input'(e, t) {
		t.ac.onKeyDown(e);
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const { deleteLastItem } = t;
			return deleteLastItem && deleteLastItem();
		}
	},
	'keyup input'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus input'(e, t) {
		t.ac.onFocus(e);
	},
	'blur input'(e, t) {
		t.ac.onBlur(e);
	},
	'click .rc-tags__tag'({ target }, t) {
		const { onClickTag } = t;
		return onClickTag & onClickTag(Blaze.getData(target));
	},
});
Template.SearchCreateDiscussion.onRendered(function() {
	const { name } = this.data;

	this.ac.element = this.firstNode.querySelector(`[name=${ name }]`);
	this.ac.$element = $(this.ac.element);
});

Template.SearchCreateDiscussion.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar([]);
	this.onClickTag = this.data.onClickTag;
	this.deleteLastItem = this.data.deleteLastItem;

	const { collection, endpoint, field, sort, onSelect, selector = (match) => ({ term: match }) } = this.data;
	this.ac = new AutoComplete(
		{
			selector: {
				anchor: '.rc-input__label',
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list',
			},
			onSelect,
			position: 'fixed',
			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection,
					endpoint,
					field,
					matchAll: true,
					// filter,
					doNotChangeWidth: false,
					selector,
					sort,
				},
			],

		});
	this.ac.tmplInst = this;
});
