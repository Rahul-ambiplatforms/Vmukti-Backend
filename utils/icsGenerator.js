const ics = require('ics');
const moment = require('moment-timezone');

/**
 * ICS Calendar Generator for VMukti Demo Bookings
 * 
 * IMPORTANT: This class generates different ICS files for users vs organizers
 * - Users receive METHOD:REQUEST (invitation to accept)
 * - Organizers receive METHOD:PUBLISH (informational, already accepted)
 * 
 * This fixes the issue where Gmail shows "Unable to load event" for organizers
 * when they receive REQUEST method invitations for meetings they're organizing.
 */

class ICSGenerator {
    static generateCalendarInvite(eventDetails, meetLink, isForOrganizer = false) {
        try {
            const { fullName, email, selectedDate, selectedTime, message } = eventDetails;

            // Parse date & time in IST (Asia/Kolkata)
            const eventDateTimeIST = moment.tz(
                `${selectedDate} ${selectedTime}`,
                'MMMM DD, YYYY h:mm A',
                'Asia/Kolkata'
            );

            // Start time (IST)
            const startArray = [
                eventDateTimeIST.year(),
                eventDateTimeIST.month() + 1,
                eventDateTimeIST.date(),
                eventDateTimeIST.hour(),
                eventDateTimeIST.minute()
            ];

            // End time (IST + 30 mins)
            const endDateTimeIST = eventDateTimeIST.clone().add(30, 'minutes');
            const endArray = [
                endDateTimeIST.year(),
                endDateTimeIST.month() + 1,
                endDateTimeIST.date(),
                endDateTimeIST.hour(),
                endDateTimeIST.minute()
            ];

            const event = {
                start: startArray,
                end: endArray,

                // 👇 IMPORTANT: Store in IST
                startInputType: 'local',
                startOutputType: 'local',
                timezone: 'Asia/Kolkata',

                title: `Demo Meeting with ${fullName}`,
                description: `Demo meeting scheduled with ${fullName} (${email})\n\nRequirements: ${
                    message || 'No specific requirements mentioned'
                }\n\nJoin Meeting: ${meetLink}`,
                location: meetLink,
                url: meetLink,

                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                categories: ['Demo', 'Meeting'],

                organizer: {
                    name: 'VMukti Sales Team',
                    email: process.env.RECEIVING_EMAIL
                },

                attendees: isForOrganizer ? [
                    {
                        name: 'VMukti Sales Team',
                        email: process.env.RECEIVING_EMAIL,
                        rsvp: true,
                        partstat: 'ACCEPTED',
                        role: 'CHAIR'
                    },
                    {
                        name: fullName,
                        email,
                        rsvp: true,
                        partstat: 'NEEDS-ACTION',
                        role: 'REQ-PARTICIPANT'
                    }
                ] : [
                    {
                        name: fullName,
                        email,
                        rsvp: true,
                        partstat: 'NEEDS-ACTION',
                        role: 'REQ-PARTICIPANT'
                    },
                    {
                        name: 'VMukti Sales Team',
                        email: process.env.RECEIVING_EMAIL,
                        rsvp: true,
                        partstat: 'ACCEPTED',
                        role: 'CHAIR'
                    }
                ],

                alarms: [
                    {
                        action: 'display',
                        description: 'Demo meeting reminder',
                        trigger: { hours: 24, before: true }
                    },
                    {
                        action: 'display',
                        description: 'Demo meeting starting soon',
                        trigger: { minutes: 30, before: true }
                    }
                ]
            };

            const { error, value } = ics.createEvent(event);
            if (error) return null;

            return value;
        } catch (err) {
            return null;
        }
    }

    // --------------------------------------------------
    // Fallback: Manual ICS (IST-based)
    // --------------------------------------------------
    static generateSimpleICS(eventDetails, meetLink, isForOrganizer = false) {
        const { fullName, email, selectedDate, selectedTime, message } = eventDetails;

        const eventDateTimeIST = moment.tz(
            `${selectedDate} ${selectedTime}`,
            'MMMM DD, YYYY h:mm A',
            'Asia/Kolkata'
        );

        const startTime = eventDateTimeIST.format('YYYYMMDDTHHmmss');
        const endTime = eventDateTimeIST.clone().add(30, 'minutes').format('YYYYMMDDTHHmmss');
        const uid = `demo-${Date.now()}@vmukti.com`;
        
        // Different METHOD for organizer vs attendee
        const method = isForOrganizer ? 'PUBLISH' : 'REQUEST';
        const organizerPartstat = isForOrganizer ? 'ACCEPTED' : 'ACCEPTED';
        const attendeePartstat = isForOrganizer ? 'NEEDS-ACTION' : 'NEEDS-ACTION';

        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VMukti//Demo Booking//EN
CALSCALE:GREGORIAN
METHOD:${method}
BEGIN:VTIMEZONE
TZID:Asia/Kolkata
BEGIN:STANDARD
TZOFFSETFROM:+0530
TZOFFSETTO:+0530
TZNAME:IST
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:${uid}
DTSTART;TZID=Asia/Kolkata:${startTime}
DTEND;TZID=Asia/Kolkata:${endTime}
SUMMARY:Demo Meeting with ${fullName}
DESCRIPTION:Demo meeting scheduled with ${fullName} (${email})\\n\\nRequirements: ${
            message || 'No specific requirements mentioned'
        }\\n\\nJoin Meeting: ${meetLink}
LOCATION:${meetLink}
ORGANIZER;CN=VMukti Sales Team:mailto:${process.env.RECEIVING_EMAIL}
ATTENDEE;CN=${fullName};RSVP=TRUE;PARTSTAT=${attendeePartstat}:mailto:${email}
ATTENDEE;CN=VMukti Sales Team;RSVP=TRUE;PARTSTAT=${organizerPartstat}:mailto:${process.env.RECEIVING_EMAIL}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Demo meeting reminder
END:VALARM
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Demo meeting starting soon
END:VALARM
END:VEVENT
END:VCALENDAR`;
    }
}

module.exports = ICSGenerator;
