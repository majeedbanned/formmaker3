# SMS Module

This module implements the integration with a SOAP-based SMS API for sending SMS messages and managing phonebooks.

## API Endpoints

### SMS Management

- `GET /api/sms/credit` - Get account credit
- `POST /api/sms/send` - Send SMS to multiple recipients

### Phonebook Management

- `GET /api/sms/phonebook/list` - List all phonebooks
- `GET /api/sms/phonebook/numbers` - Get numbers in a phonebook
- `POST /api/sms/phonebook/add` - Create a new phonebook
- `DELETE /api/sms/phonebook/delete` - Delete a phonebook
- `DELETE /api/sms/phonebook/numbers/delete` - Delete numbers from a phonebook
- `POST /api/sms/phonebook/send` - Send SMS to all numbers in a phonebook

## Configuration

Set the following environment variables in `.env.local`:

```
SMS_USERNAME=your_sms_username
SMS_PASSWORD=your_sms_password
```

## SOAP API Documentation

The SMS API is available at: http://185.112.33.61/webservice/send.php?wsdl

### Implemented Methods

- `GetCredit` - Get account credit
- `SendSMS` - Send SMS to multiple numbers
- `SendMultiSMS` - Send multiple contents to multiple numbers
- `SendOfPhoneBook` - Send SMS to a phonebook
- `listPhonebook` - List all phonebooks
- `numbersPhonebook` - Get numbers in a phonebook
- `AddPhonebook` - Add a new phonebook
- `AddToPhonebook` - Add numbers to an existing phonebook
- `deleteNumbersOfPhonebook` - Delete numbers from a phonebook
- `deletePhonebook` - Delete a phonebook
- `details` - Get account details
- `GetStatus` - Get message delivery status

## UI Components

The SMS admin interface includes:

1. SMS sending section

   - Send to individual recipients
   - Send to phonebooks

2. Phonebook management
   - Create new phonebooks
   - View and manage existing phonebooks
   - View and delete numbers in phonebooks
