const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
});

const { getFormValues } = require('./puppeteer');

const FORM_URL = `https://docs.google.com/forms/d/e/${process.env.GOOGLE_FORM_ID}/viewform`;

const formVals = {
  eventName: 'Weekly Hack Night',
  eventDate: '2019-02-26',
  eventTime: '19:00',
  attendees: ['Alexander Hughes',
    'Aman Jha',
    'Andrew Francisque',
    'Anthony Castrio',
    'Audra Jamai',
    'Dimitry Erastov',
    'Fahima Depa Ahmed',
    'Guthemberg Teixeira',
    'Harlan Weber',
    'J.Martini',
    'Jason L',
    'Jaspreet Kaur',
    'Jeffrey Amari',
    'John Bogosian Trocchi',
    'John Rudnik',
    'Joshua DeCosta',
    'Liz B',
    'Maia ',
    'Marco Cuentas',
    'Mario Villacreses',
    'Max Steele',
    'Mike Y',
    'Rahul Motan',
    'russ',
    'Sahil Bhatt',
    'Sergey',
    'Sonya Harvey-Justiniano',
    'Spriha Jha',
    'Thiago Teixeira',
    'Tim C.',
    'Valerie Kenyon',
    'Vidya Nathan',
    'Vivek Ramanan'
  ],
  eventLocation: '4th floor Kitchen',
  allowWalkins: 'Yes',
  cfbContactInfo: 'Matt Zagja, 860-883-8042',
  cicContactEmail: 'wang@cic.com',
  organizationName: 'Code for Boston'
};

getFormValues(FORM_URL, formVals).then(
  function(formValues) {
    console.log(formValues);
  }
).catch(
  function(error) {
    console.error(error);
    process.exit(1);
  }
);
