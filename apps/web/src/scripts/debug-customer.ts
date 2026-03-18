
import { Schema } from "effect"
import { Customer } from "@kemotsho/module-commerce/customers/domain/Customer"
import { Either } from "effect"

const mockFirestoreData = {
    "id": "E0Ha9Rg0wLXZaJXhLalb",
    "userId": "lNbGD0ZkBSg9BmL0MBajxfPPMvv2",
    "email": "tebogo@waroo.co.za",
    "firstName": "Thabo",
    "lastName": "Lestatisti",
    "phone": "0112282828",
    "createdAt": new Date().toISOString(),
    "updatedAt": new Date().toISOString(),
    "addresses": [
        {
            "city": "Johannesburg",
            "company": null,
            "country": "ZA",
            "email": "tebogo@waroo.co.za",
            "firstName": "Thabo",
            "lastName": "Lestatisti",
            "line1": "101 Lethetthu street",
            "line2": null,
            "phone": "0112282828",
            "postalCode": "1010",
            "state": null
        }
    ],
    "defaultShippingAddress": {
        "city": "Johannesburg",
        "company": null,
        "country": "ZA",
        "email": "tebogo@waroo.co.za",
        "firstName": "Thabo",
        "lastName": "Lestatisti",
        "line1": "101 Lethetthu street",
        "line2": null,
        "phone": "0112282828",
        "postalCode": "1010",
        "state": null
    },
    "defaultBillingAddress": null
}

const decode = Schema.decodeUnknownEither(Customer)
const result = decode(mockFirestoreData)

if (Either.isLeft(result)) {
    console.error("Decoding Failed:")
    console.error(JSON.stringify(result.left, null, 2))
} else {
    console.log("Decoding Success!")
    // console.log(result.right)
    
    // Now test encoding
    const encoded = Schema.encodeSync(Customer)(result.right)
    console.log("Encoded Result for UI:")
    console.log(JSON.stringify(encoded, null, 2))
}
