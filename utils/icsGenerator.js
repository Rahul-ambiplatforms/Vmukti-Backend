const ics = require('ics');
const moment = require('moment-timezone');

class ICSGenerator {
    static generateCalendarInvite(eventDetails, meetLink) {
        try {
            const { fullName, email, selectedDate, selectedTime, message } = eventDetails;

            // Parse the date and time in IST
            const eventDateTime = moment.tz(`${selectedDate} ${selectedTime}`, 'MMMM DD, YYYY h:mm A', 'Asia/Kolkata');

            // Convert to array format required by ics library
            const startArray = [
                eventDateTime.year(),
                eventDateTime.month() + 1, // ics expects 1-based months
                eventDateTime.date(),
                eventDateTime.hour(),
                eventDateTime.minute()
            ];

            const endDateTime = eventDateTime.clone().add(30, 'minutes');
            const endArray = [
                endDateTime.year(),
                endDateTime.month() + 1,
                endDateTime.date(),
                endDateTime.hour(),
                endDateTime.minute()
            ];

            const event = {
                start: startArray,
                end: endArray,
                title: `Demo Meeting with ${fullName}`,
                description: `Demo meeting scheduled with ${fullName} (${email})\\n\\nRequirements: ${message || 'No specific requirements mentioned'}\\n\\nJoin Google Meet: ${meetLink}`,
                location: meetLink,
                url: meetLink,
                geo: { lat: 40.0095, lon: 105.2669 },
                categories: ['Demo', 'Meeting'],
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                organizer: { name: 'VMukti Sales Team', email: process.env.RECEIVING_EMAIL },
                attendees: [
                    { name: fullName, email: email, rsvp: true, partstat: 'NEEDS-ACTION', role: 'REQ-PARTICIPANT' },
                    { name: 'VMukti Sales Team', email: process.env.RECEIVING_EMAIL, rsvp: true, partstat: 'ACCEPTED', role: 'CHAIR' }
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

            if (error) {
                return null;
            }

            return value;
        } catch (error) {
            return null;
        }
    }

    static generateSimpleICS(eventDetails, meetLink) {
        // Fallback simple ICS generation if the main method fails
        const { fullName, email, selectedDate, selectedTime, message } = eventDetails;
        const eventDateTime = moment.tz(`${selectedDate} ${selectedTime}`, 'MMMM DD, YYYY h:mm A', 'Asia/Kolkata');

        const startTime = eventDateTime.format('YYYYMMDDTHHmmss');
        const endTime = eventDateTime.clone().add(30, 'minutes').format('YYYYMMDDTHHmmss');
        const uid = `demo-${Date.now()}@vmukti.com`;

        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//VMukti//Demo Booking//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTART;TZID=Asia/Kolkata:${startTime}
DTEND;TZID=Asia/Kolkata:${endTime}
SUMMARY:Demo Meeting with ${fullName}
DESCRIPTION:Demo meeting scheduled with ${fullName} (${email})\\n\\nRequirements: ${message || 'No specific requirements mentioned'}\\n\\nJoin Google Meet: ${meetLink}
LOCATION:${meetLink}
ORGANIZER;CN=VMukti Sales Team:mailto:${process.env.RECEIVING_EMAIL}
ATTENDEE;CN=${fullName};RSVP=TRUE:mailto:${email}
ATTENDEE;CN=VMukti Sales Team;RSVP=TRUE:mailto:${process.env.RECEIVING_EMAIL}
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