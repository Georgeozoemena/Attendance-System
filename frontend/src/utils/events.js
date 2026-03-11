// Event configurations for the attendance system
export const EVENT_CONFIGS = {
    'sunday-service': {
        name: 'Sunday Service',
        day: 'Sunday',
        time: '8:00 AM',
        description: 'Main weekly worship service'
    },
    'wednesday-service': {
        name: 'Wednesday Service',
        day: 'Wednesday',
        time: '7:00 PM',
        description: 'Mid-week Bible study and service'
    },
    'special-program': {
        name: 'Special Program',
        day: 'TBD',
        time: 'TBD',
        description: 'Special church program or event'
    },
    'youth-service': {
        name: 'Youth Service',
        day: 'Friday',
        time: '5:00 PM',
        description: 'Weekly youth gathering'
    },
    'children-service': {
        name: "Children's Service",
        day: 'Sunday',
        time: '10:00 AM',
        description: 'Sunday school and children worship'
    }
};

// Helper function to get event config
export const getEventConfig = (eventId) => {
    return EVENT_CONFIGS[eventId] || {
        name: eventId,
        day: 'TBD',
        time: 'TBD',
        description: ''
    };
};

// Helper to format event time
export const formatEventTime = (eventId) => {
    const config = getEventConfig(eventId);
    if (config.time === 'TBD') return 'Time TBD';
    return `${config.day}s at ${config.time}`;
};
