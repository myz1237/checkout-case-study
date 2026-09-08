## Debug Results

### Request 01
Response from api ep:

```json
{"request_id":"0cbf5ae3-0920-4cb3-b12b-059a70e653a3","error_type":"request_invalid","error_codes":["request_body_malformed"]}
```

Error: Malformed Body
Debug: Body's properties may be incorrect, check it by reading the doc and find that the type of merchant_initiated should be boolean, rather than string.
How to fix: Feed "true" to make it work. "false" value results in "card_expired" error, which is a logic one, just update "expiry_year" to 2027, it returns a 200 response

### Request 02
Response from api ep:

```json
{"request_id":"460e89a1-488b-42ba-b422-0da2b678288b","error_type":"request_invalid","error_codes":["processing_channel_id_required"]}
```
Error: channel id is required
Debug: Miss "processing_channel_id"
Fix: Add the key-value: "processing_channel_id": "pc_zs5fqhybzc2e3jmq3efvybybpq", get "card_expired", update "expiry_year" to 2027, it returns 200 response

### Request 03
Response from api ep:

```json
{
    "request_id": "e1601f7f-46cb-494f-abb3-98dedcc1a9eb",
    "error_type": "request_invalid",
    "error_codes": [
        "amount_invalid"
    ]
}
```
Error: The value of amount is invalid
Debug: The type of amount is integer, but it feeds a float
Fix: Different currency has its own factor, USD's is 100, the correct value should be 1099. As mentioned before, still get expiry issue, just changes to 2027 and get 200 response

### Request 04
Response from api ep:

```json
{
    "request_id": "37085edc-be59-4577-b748-c2ffd336973f",
    "error_type": "request_invalid",
    "error_codes": [
        "currency_invalid"
    ]
}
```
Error: Currency is invalid
Debug: Try "USD" as currency, not work: "currency_not_supported" and "payment_country_invalid". Search BanContact and find it's a Belgium payment company
Fix: Use "EUR" as currency and "BE" for Belgium as payment_country, which works well and returns 200 response

### Request 05
Response from api ep:

```json
{
    "request_id": "85dbb329-3ec4-4d0e-99aa-139f7ab51b43",
    "error_type": "processing_error",
    "error_codes": [
        "card_expired"
    ]
}
```
Error: Card has expired
Debug: The card information is mocked and 2025 has expired
Fix: Use 2027 as "expiry_year" and it returns 200 response

### Request 06
Response from api ep:

```json
{"request_id":"7564bf56-a55a-48aa-89aa-a424a600af95","error_type":"request_invalid","error_codes":["card_number_required","card_expiry_month_required","card_expiry_year_required"]}
```
Error: Card information is required
Debug: Open the console, read the log and find "card_expired", use 2027 as expiry_year, run it again, same error, find the type of source is wrong, it should be "id"
Fix: source of http call should be "id" and expiry_year of http call of pre-request should be 2027