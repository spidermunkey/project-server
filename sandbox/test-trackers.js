const client = require('../utils/connect');
const uri = require('../.env/config.js');

async function test() {

    const connection = await client.connect(uri);

    const db = connection.db('trackers');
    const collection = db.collection('all');

    const logDB = connection.db('Timers');
    const logCollection = logDB.collection('logs');


    const testIDs = {
        cleanup: 'lr7wdx7k-01YSYNQSS3ZW',
        study: 'lrjsdbsm-00U8G6XL2C0S',
        mindmap: 'lrk5fz44-01DGAIQQ7GA7',
        workout: 'lr7ufosd-00KGVWJEDDHG',
    };

    const tID = testIDs['workout'];
    const trackerQuery = {'id':tID};
    const trackerLogsQuery = {'tID': tID};
    
    const tracker = await collection.findOne( trackerQuery );
    const trackerLogs = await logCollection.find( trackerLogsQuery ).toArray();

    
    const date = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[date.getDay()];
    const lastSunday = (date.getDate() - date.getDay()).toString();
    const nextSunday = (date.getDate() + (7 - date.getDay())).toString();
    const dateString = date.toISOString();
    let lastSundayDateString = date.toISOString();
        let temp = lastSundayDateString.split('')
                temp.splice(8,2,...lastSunday)
                   temp.splice(-1);
        lastSundayDateString = temp.join('');
    
    let nextSundayDateString = date.toISOString();
            temp = nextSundayDateString.split();
                temp.splice(8,2,...nextSunday)
                temp.splice(-1);
        // lastSundayDateString.join()
    const lastSundayDateObject = new Date(lastSundayDateString);
    const nextSundayDateObject = new Date(nextSundayDateString);
    const thisWeek = date.getDay()

    const sortbyDay = (a,b) => days.indexOf(a) - days.indexOf(b);

    const filterToday = ({stamp}) => filterDay(today)({stamp}),
            filterDay = (dayName) => ({stamp}) => (stamp.day.toLowerCase() == dayName.toLowerCase());

    
    const todaysLogs = (logs) => {

        const logsToday = logs.filter(filterToday);

        if (logsToday.length <= 0 )
            return null;

        return {
            logs:[logsToday],
            total: logsToday[logsToday.length - 1].elapsed,
        }
    };

    const logsByDay = (logs) => {
        const dayLogs = logs
            .filter(log => log.type == 'stop')
            .reduce((logsByDay , log )=> {
                const dayOfWeek = log.stamp.day
                if (!logsByDay[dayOfWeek]){
                    logsByDay[dayOfWeek] = {
                        logs: [log],
                        total: log.elapsed,
                    }
                    return logsByDay
                }
                else {
                    logsByDay[dayOfWeek].logs.push(log);
                    logsByDay[dayOfWeek].total = log.elapsed;
                    return logsByDay
                }
            }, {} )

        console.log(dayLogs)
        console.log(dayLogs['Friday'].logs[0]);
    };

    const logsThisWeek = logs => logs
        .filter(log => log.type == 'stop')
            .filter(log => log.stamp.date > Number(lastSunday) && log.stamp.date <= Number(nextSunday));

    console.log(nextSunday);
    console.log(todaysLogs(trackerLogs));
    console.log(logsThisWeek(trackerLogs),'here');

}


function msToStamp(ms) {
    const msInHour = 3600000;
    const msInMin = 60000;
    const msInSec = 1000;
    const minutesInHour = 60;
    const secondsInMinute = 60;

    const hours = ms >= msInHour ? Math.floor(ms / msInHour) : 0;
    // const hours = hoursAgo;

    // const minutesAgo = ms >= msInMin ? Math.floor(ms / msInMin) : 0;
    const minutes = Math.floor(getRemainder(ms/msInHour) * minutesInHour);

    // const secondsAgo = ms >= msInSec ? Math.floor(ms / msInSec) : 0;
    const seconds = Math.floor(getRemainder(ms/msInMin) * secondsInMinute);

    function getRemainder(float) { // miliseconds left after floored value IN DECIMAL
        return float - Math.floor(float);
    }
    return {
        hours,
        minutes,
        seconds
    }
}


test();