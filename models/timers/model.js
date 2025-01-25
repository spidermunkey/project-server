const client = require('../../utils/connect');
const uri = require('../../.config/env.js');


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

const date = new Date(),
        days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
        today = days[date.getDay()],
        lastSunday = (date.getDate() - date.getDay()).toString(),
        nextSunday = (date.getDate() + (7 - date.getDay())).toString(),
        dateString = date.toISOString();

        let lastSundayDateString = date.toISOString();

        let temp = lastSundayDateString.split('')
                temp.splice(8,2,...lastSunday)
                   temp.splice(-1);

            lastSundayDateString = temp.join('');
    
        let nextSundayDateString = date.toISOString();
                temp = nextSundayDateString.split('');
                    temp.splice(8,2,...nextSunday)
                    temp.splice(-1);
            nextSundayDateString = temp.join('');
        
const lastSundayDateObject = new Date(lastSundayDateString);
const nextSundayDateObject = new Date(nextSundayDateString);

const isThisWeek = (date) => date > Number(lastSunday) && date <= Number(nextSunday);

function sortbyDay() {
    const arr = this.slice();
    const byDay = (a,b) => days.indexOf(a) - days.indexOf(b);
    return arr.sort(byDay)
}

function getDay(dayName) {
    const filterDay = log => log.stamp.day.toLowerCase() == dayName.toLowerCase();
    return this.filter(filterDay)
}

function getToday() {
    return getDay.call(this,today)
}

function thisWeek() {
    const filterThisWeek = (log) => isThisWeek(log.stamp.date)
    return this.filter(log => log.type == 'stop')
                .filter(filterThisWeek)
}

function total(context) {
    if (!context)
        return this[this.length - 1] ? this[this.length - 1].elapsed : null

    return context[context.length - 1] ? context[context.length - 1].elapsed : null;
}


class API {
    constructor() {
        this.url = uri;
        this.connection = null;
    }

    async connect() {

        const connection = await client.connect(uri);
        const trackers = connection.db('trackers');
        const allTrackers = trackers.collection('all');
    
        const timers = connection.db('Timers');
        const allTimers = timers.collection('all');
        const logs = timers.collection('logs');

        return {
            timers: allTimers,
            trackers: allTrackers,
            logs,
        }

    }

    async getLogs(tID){
        const {logs} = await this.connect();
        const query = {'tID': tID};
        const trackerLogs = await logs.find( query ).toArray();

            trackerLogs.sortbyDay = sortbyDay
            trackerLogs.getDay = getDay
            trackerLogs.today = getToday
            trackerLogs.thisWeek = thisWeek
            Object.defineProperty(trackerLogs, "weeklyTotal", {
                get : function () {
                    return total(trackerLogs.thisWeek())
                }
            });
            Object.defineProperty(trackerLogs, 'total',{
                get: function() {
                    return total(trackerLogs)
                }
            })
        return {
            all: trackerLogs,
            today: trackerLogs.today(),
            thisWeek: trackerLogs.thisWeek(),
            total: trackerLogs.total,
            totalWeek: trackerLogs.weeklyTotal,
        }
    }

    async getTimerData() {
        const data = await (await this.connect()).timers.find().toArray();
        return data
    }

    async getTimers(){

        const data = await this.getTimerData();

        const mapper = async (data) => { 
            const logs = await this.getLogs(data.id);
            return {
                title: data.title,
                id: data.id,
                time: data.time,
                days: data.days,
                initial: data.initial,
                logs,
            }
        }
        const timers = await Promise.all(data.map(mapper))
        return timers
    }

    async getTimer(tID){
        const data = await this.getTimerData();
        return data.filter(data => data.id === tID);

    }

    async getTask(tID){

    }

    async getTasks(){

    }
}

module.exports.api = new API();
        
(async function test() {

    const api = new API()
        await api.connect();
        const logs = await api.getLogs('lr7ufosd-00KGVWJEDDHG');
        console.log('logged',logs.total)

})()
