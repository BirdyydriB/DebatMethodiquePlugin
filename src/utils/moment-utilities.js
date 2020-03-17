/**
 * External libraries
 */
const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');

/**
 * Project requirements
 */
const localize = require('../parameters/localization/localize');
const {
  LANG
} = require('../parameters/parameters');

/**
  * Init moment, settings for localization fr
  * @access public
  */
function initMoment() {
  moment.locale('fr', {
    months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split('_'),
    monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split('_'),
    monthsParseExact: true,
    weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
    weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
    weekdaysMin: 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
    weekdaysParseExact: true,
    longDateFormat: {
      LT: 'HH:mm',
      LTS: 'HH:mm:ss',
      L: 'DD/MM/YYYY',
      LL: 'D MMMM YYYY',
      LLL: 'D MMMM YYYY HH:mm',
      LLLL: 'dddd D MMMM YYYY HH:mm'
    },
    calendar: {
      sameDay: '[Aujourd’hui à] LT',
      nextDay: '[Demain à] LT',
      nextWeek: 'dddd [à] LT',
      lastDay: '[Hier à] LT',
      lastWeek: 'dddd [dernier à] LT',
      sameElse: 'L'
    },
    relativeTime: {
      future: '%s plus tard',
      past: 'il y a %s',
      s: 'quelques secondes',
      m: 'une minute',
      mm: '%d minutes',
      h: 'une heure',
      hh: '%d heures',
      d: 'un jour',
      dd: '%d jours',
      M: 'un mois',
      MM: '%d mois',
      y: 'un an',
      yy: '%d ans'
    },
    durationLabelsStandard: {
        S: 'millisecond',
        SS: 'milliseconds',
        s: 'seconde',
        ss: 'secondes',
        m: 'minute',
        mm: 'minutes',
        h: 'heure',
        hh: 'heures',
        d: 'jour',
        dd: 'jours',
        w: 'semaine',
        ww: 'semaines',
        M: 'mois',
        MM: 'mois',
        y: 'année',
        yy: 'années'
    },
    durationLabelsShort: {
        S: 'msec',
        SS: 'msecs',
        s: 'sec',
        ss: 'secs',
        m: 'min',
        mm: 'mins',
        h: 'hr',
        hh: 'hrs',
        d: 'jour',
        dd: 'jours',
        w: 'sem',
        ww: 'sems',
        M: 'mois',
        MM: 'mois',
        y: 'an',
        yy: 'ans'
    },
    dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
    ordinal: function(number) {
      return number + (number === 1 ? 'er' : 'e');
    },
    meridiemParse: /PD|MD/,
    isPM: function(input) {
      return input.charAt(0) === 'M';
    },
    meridiem: function(hours, minutes, isLower) {
      return hours < 12 ? 'PD' : 'MD';
    },
    week: {
      dow: 1, // Monday is the first day of the week.
      doy: 4 // Used to determine first week of the year.
    }
  });

  // moment.relativeTimeRounding(Math.round());

  // Set moment locale to current LANG value
  moment.locale(LANG.currentValue);
}

/**
  * Return a well formated and rounded duration beetween two moments
  * @access public
  * @param {object} diff - Time difference to format
  * @param {int} diff.years - Number of years
  * @param {int} diff.months - Number of months
  * @param {int} diff.days - Number of days
  * @param {int} diff.hours - Number of hours
  * @param {int} diff.minutes - Number of minutes
  * @param {boolean} fromNow - True if you want difference from now, false if you want difference from a parent
  * @returns {string} the formated duration
  */
function formatDiffDate(diff, fromNow) {
  var diffDate, dateTemplate;
  const hasMonthsRounded = (diff.months >= moment.relativeTimeThreshold('M'));
  const hasDaysRounded = (diff.days >= moment.relativeTimeThreshold('d'));
  const hasHoursRounded = (diff.hours >= moment.relativeTimeThreshold('h'));
  const hasMinutesRounded = (diff.minutes >= moment.relativeTimeThreshold('m'));
  const hasYears = (diff.years > 0) || hasMonthsRounded;
  const hasMonths = (diff.months > 0) || hasDaysRounded;
  const hasDays = (diff.days > 0) || hasHoursRounded;
  const hasHours = (diff.hours > 0) || hasMinutesRounded;
  const hasMinutes = (diff.minutes > 0);

  if(hasYears) {
    diffDate = moment.duration({
      years: diff.years,
      months: diff.months
    });
    dateTemplate = 'Y __, M __';
  }
  else if(hasMonths && !hasMonthsRounded) {
    diffDate = moment.duration({
      months: diff.months,
      days: diff.days
    });
    dateTemplate = 'M __, D __';
  }
  else if(hasDays && !hasDaysRounded && !hasYears) {
    diffDate = moment.duration({
      days: diff.days,
      hours: diff.hours
    });
    dateTemplate = 'D __, H _';
  }
  else if(hasHours && !hasHoursRounded && !hasYears && !hasMonths) {
    diffDate = moment.duration({
      hours: diff.hours,
      minutes: diff.minutes
    });
    dateTemplate = 'H _, m _';
  }
  else if(hasMinutes && !hasMinutesRounded && !hasYears && !hasMonths && !hasDays) {
    diffDate = moment.duration({
      minutes: diff.minutes,
      seconds: diff.seconds
    });
    dateTemplate = 'm _, s _';
  }

  const dateStr = fromNow ? 'COMMENT_DATE_FROMNOW' : 'COMMENT_DATE_AFTERPARENT';

  return localize(dateStr, diffDate.format({
      template: dateTemplate,
      trim: 'both'
  }));
}

module.exports = {
  initMoment: initMoment,
  formatDiffDate: formatDiffDate
};
