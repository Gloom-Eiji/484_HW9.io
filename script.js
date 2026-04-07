// ==========================
// Part 1: Date Display
// ==========================

// Create a Date object for right now
var today = new Date();

// getMonth() is 0-based, so add 1
var month = today.getMonth() + 1;
var day = today.getDate();
var year = today.getFullYear();

// Pad month and day to two digits if needed
if (month < 10) {
  month = "0" + month;
}
if (day < 10) {
  day = "0" + day;
}

var dateString = "Today is " + month + "/" + day + "/" + year;

document.getElementById("dateOutput").innerHTML = dateString;


// ==========================
// Part 2: Number Conversion
// ==========================

// Four separate starting values
var valA = "42";
var valB = "19.75";
var valC = "hello";
var valD = "100";

// Convert each with Number()
var convertedA = Number(valA);
var convertedB = Number(valB);
var convertedC = Number(valC);
var convertedD = Number(valD);

// Build result lines using if/else for NaN check (Part 4 requirement)
var lineA;
if (Number.isNaN(convertedA)) {
  lineA = "Original: '" + valA + "' → Converted: NaN → isNaN: true → isInteger: false — This value is not a valid number.";
} else {
  lineA = "Original: '" + valA + "' → Converted: " + convertedA +
          " → isNaN: false → isInteger: " + Number.isInteger(convertedA);
}

var lineB;
if (Number.isNaN(convertedB)) {
  lineB = "Original: '" + valB + "' → Converted: NaN → isNaN: true → isInteger: false — This value is not a valid number.";
} else {
  lineB = "Original: '" + valB + "' → Converted: " + convertedB +
          " → isNaN: false → isInteger: " + Number.isInteger(convertedB);
}

// valC ("hello") cannot convert — if/else covers the NaN case
var lineC;
if (Number.isNaN(convertedC)) {
  lineC = "Original: '" + valC + "' → Converted: NaN → isNaN: true → isInteger: false — This value is not a valid number.";
} else {
  lineC = "Original: '" + valC + "' → Converted: " + convertedC +
          " → isNaN: false → isInteger: " + Number.isInteger(convertedC);
}

var lineD;
if (Number.isNaN(convertedD)) {
  lineD = "Original: '" + valD + "' → Converted: NaN → isNaN: true → isInteger: false — This value is not a valid number.";
} else {
  lineD = "Original: '" + valD + "' → Converted: " + convertedD +
          " → isNaN: false → isInteger: " + Number.isInteger(convertedD);
}

// Combine all lines into one string and display
var conversionResults = lineA + "<br>" + lineB + "<br>" + lineC + "<br>" + lineD;
document.getElementById("numberConversionOutput").innerHTML = conversionResults;


// ==========================
// Part 3: Math & Formatting
// ==========================

// Price calculator — item price, tax rate, shipping
var itemPrice = 49.99;
var taxRate = 0.095;       // 9.5%
var shippingCost = 5.99;

// Calculations
var taxAmount = itemPrice * taxRate;
var subtotal = itemPrice + shippingCost;
var totalCost = subtotal + taxAmount;

// Format results — toFixed(2) keeps currency clean
var formattedItem     = "$" + itemPrice.toFixed(2);
var formattedTax      = "$" + taxAmount.toFixed(2);
var formattedShipping = "$" + shippingCost.toFixed(2);
var formattedTotal    = "$" + totalCost.toFixed(2);

// Part 4: second if/else — flag orders over $50 as "Premium"
var orderLabel;
if (totalCost >= 50) {
  orderLabel = "Premium Order";
} else {
  orderLabel = "Standard Order";
}

var mathResults =
  "Item Price: " + formattedItem + "<br>" +
  "Tax (9.5%): " + formattedTax + "<br>" +
  "Shipping: "   + formattedShipping + "<br>" +
  "<strong>Total: " + formattedTotal + "</strong><br>" +
  "Order type: " + orderLabel;

document.getElementById("mathOutput").innerHTML = mathResults;
