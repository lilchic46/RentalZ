var ERROR = 'ERROR';

// Create or Open Database.
var db = window.openDatabase('CW1', '1.0', 'CW1', 20000);

// To detect whether users use mobile phones horizontally or vertically.
$(window).on('orientationchange', onOrientationChange);

// Display messages in the console.
function log(message, type = 'INFO') {
    console.log(`${new Date()} [${type}] ${message}`);
}

function onOrientationChange(e) {
    if (e.orientation == 'portrait') {
        log('Portrait.');
    }
    else {
        log('Landscape.');
    }
}

// To detect whether users open applications on mobile phones or browsers.
if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    $(document).on('deviceready', onDeviceReady);
}
else {
    $(document).on('ready', onDeviceReady);
}

// Display errors when executing SQL queries.
function transactionError(tx, error) {
    log(`SQL Error ${error.code}. Message: ${error.message}.`, ERROR);
}

// Run this function after starting the application.
function onDeviceReady() {
    log(`Device is ready.`);

    db.transaction(function (tx) {
        // Create table Account.
        var query = `CREATE TABLE IF NOT EXISTS Property (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         PropertyName TEXT NOT NULL UNIQUE,
                                                         PropertyAddress TEXT,
                                                         City TEXT,
                                                         District TEXT,
                                                         Ward TEXT,
                                                         PropertyType TEXT NOT NULL,
                                                         Bedrooms TEXT NOT NULL,
                                                         Date DATE NOT NULL,
                                                         RentPrice INTEGER NOT NULL,
                                                         FurnitureType TEXT,
                                                         Reporter TEXT NOT NULL)`;
        tx.executeSql(query, [], function (tx, result) {
            log(`Create table 'Property' successfully.`);
        }, transactionError);

        // Create table Note.
        var query = `CREATE TABLE IF NOT EXISTS Note (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                        Note TEXT NOT NULL,
                                                        DateTime DATE NOT NULL,
                                                        PropertyId INTEGER NOT NULL,
                                                        FOREIGN KEY (PropertyId) REFERENCES Property(Id))`;
        tx.executeSql(query, [], function (tx, result) {
            log(`Create table 'Note' successfully.`);
        }, transactionError);
    });

    prepareDatabase(db);
}

$(document).on('pagebeforeshow', '#page-create', function(){
    importCity();
    importDistrict();
    importWard(); 
});

$(document).on('change', '#page-create #frm-register #city', function(){
    importDistrict();
    importWard();
});

$(document).on('change', '#page-create #frm-register #district', function(){
    importWard();
});

function importCity(selectedId = -1){
    db.transaction(function (tx) {
        var query = 'SELECT * FROM City ORDER BY Name';
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var optionList = `<option value='-1'>Select City</option>`;
            for (let item of result.rows){
                if(item.Id == selectedId) {
                    optionList += `<option value='${item.Id}' selected>${item.Name}</option>`
                }
                else {
                    optionList += `<option value='${item.Id}'>${item.Name}</option>`
                }

                // Option 2: -- Dùng cho updated function
                //optionList += `<option value='${item.Id}' ${item.Id == selectedId ? 'selected' : '' }>${item.Name}</option>`;
            }

            $('#page-create #frm-register #city').html(optionList);
            $('#page-create #frm-register #city').selectmenu('refresh', true);
        }
    });
}

function importDistrict(){
    var cityId = $('#page-create #frm-register #city').val();
    
    db.transaction(function (tx) {
        var query = 'SELECT * FROM District WHERE CityId = ? ORDER BY Name';
        tx.executeSql(query, [cityId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var optionList = `<option value='-1'>Select District</option>`;
            for (let item of result.rows){
                optionList += `<option value='${item.Id}'>${item.Name}</option>`
            }

            $('#page-create #frm-register #district').html(optionList);
            $('#page-create #frm-register #district').selectmenu('refresh', true);
        }
    });
}

function importWard(){
    var districtId = $('#page-create #frm-register #district').val();
    
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Ward WHERE DistrictId = ? ORDER BY Name';
        tx.executeSql(query, [districtId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var optionList = `<option value='-1'>Select Ward</option>`;
            for (let item of result.rows){
                optionList += `<option value='${item.Id}'>${item.Name}</option>`
            }

            $('#page-create #frm-register #ward').html(optionList);
            $('#page-create #frm-register #ward').selectmenu('refresh', true);
        }
    });
}

// Submit a form to register a new property.
$(document).on('submit', '#page-create #frm-register', confirmProperty);
$(document).on('submit', '#page-create #frm-confirm', registerProperty);
$(document).on('vclick', '#page-create #frm-confirm', function () {
    log('Close popup confirmation.')
    $('#page-create #frm-confirm').popup('close');
});

function confirmProperty(e) {
    e.preventDefault();

    // Get user's input.
    var propertyname = $('#page-create #frm-register #property-name').val();
    var propertyaddress = $('#page-create #frm-register #property-address').val();
    var city = $('#page-create #frm-register #city option:selected').text();
    var district = $('#page-create #frm-register #district option:selected').text();
    var ward = $('#page-create #frm-register #ward option:selected').text();
    var propertytype = $('#page-create #frm-register #property-type').val();
    var bedroom = $('#page-create #frm-register #bedroom').val();
    var rentprice = $('#page-create #frm-register #rent-price').val();
    var furnituretype = $('#page-create #frm-register #furniture-type').val();
    var note = $('#page-create #frm-register #note').val();
    var reporter = $('#page-create #frm-register #reporter').val();
    
    checkProperty(propertyname, propertyaddress, city, district, ward, propertytype, bedroom, rentprice, furnituretype, note, reporter);
   
}

function checkProperty(propertyname, propertyaddress, city, district, ward, propertytype, bedroom, rentprice, furnituretype, note, reporter) {
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Property WHERE PropertyName = ?';
        tx.executeSql(query, [propertyname], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] == null) {
                log('Open the confirmation popup.');

                $('#page-create #error').empty();

                $('#page-create #frm-confirm #property-name').val(propertyname);
                $('#page-create #frm-confirm #property-address').val(propertyaddress);
                $('#page-create #frm-confirm #city').val(city);
                $('#page-create #frm-confirm #district').val(district);
                $('#page-create #frm-confirm #ward').val(ward);
                $('#page-create #frm-confirm #property-type').val(propertytype);
                $('#page-create #frm-confirm #bedroom').val(bedroom);
                $('#page-create #frm-confirm #rent-price').val(rentprice);
                $('#page-create #frm-confirm #furniture-type').val(furnituretype);
                $('#page-create #frm-confirm #note').val(note);
                $('#page-create #frm-confirm #reporter').val(reporter);

                $('#page-create #frm-confirm').popup('open');
            }
            else {
                var error = 'Property exists.';
                $('#page-create #error').empty().append(error);
                log(error, ERROR);
            }
        }
    });
}

function registerProperty(e) {
    e.preventDefault();

    var propertyname = $('#page-create #frm-confirm #property-name').val();
    var propertyaddress = $('#page-create #frm-confirm #property-address').val();
    var city = $('#page-create #frm-register #city').val();
    var district = $('#page-create #frm-register #district').val();
    var ward = $('#page-create #frm-register #ward').val();
    var propertytype = $('#page-create #frm-confirm #property-type').val();
    var bedroom = $('#page-create #frm-confirm #bedroom').val();
    var date = new Date();
    var rentprice = $('#page-create #frm-confirm #rent-price').val();
    var furnituretype = $('#page-create #frm-confirm #furniture-type').val();
    var note = $('#page-create #frm-confirm #note').val();
    var reporter = $('#page-create #frm-confirm #reporter').val();

    db.transaction(function (tx) {
        var query = 'INSERT INTO Property (PropertyName, PropertyAddress, City, District, Ward, PropertyType, Bedrooms, Date, RentPrice, FurnitureType, Reporter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        tx.executeSql(query, [propertyname, propertyaddress, city, district, ward, propertytype, bedroom, date, rentprice, furnituretype, reporter], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Create a property '${propertyname}' successfully.`);

            // Reset the form.
            $('#frm-register').trigger('reset');
            $('#page-create #error').empty();
            $('#property-name').focus();

            $('#page-create #frm-confirm').popup('close');

            if (note != '') {
                db.transaction(function (tx) {
                    var query = `INSERT INTO Note (Note, PropertyId, DateTime) VALUES (?, ?, ?)`;
                    tx.executeSql(query, [note, result.insertId, date], transactionSuccess, transactionError);

                    function transactionSuccess(tx, result) {
                        log(`Add new note to property '${propertyname}' successfully.`);
                    }
                });
            }
        }
    });
}

// Display Property List.
$(document).on('pagebeforeshow', '#page-list', showList);

function showList() {
    db.transaction(function (tx) {
        var query = 'SELECT Id, PropertyName, PropertyAddress, PropertyType FROM Property';
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of properties successfully.`);

            // Prepare the list of properties.
            var listProperty = `<ul id='list-property' data-role='listview' data-filter='true' data-filter-placeholder='Search Properties...'
                                                     data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for (let property of result.rows) {
                listProperty += `<li><a data-details='{"Id" : ${property.Id}}'>
                                    <h3>Property Name: ${property.PropertyName}</h3>
                                    <p>Property Address: ${property.PropertyAddress}</p>
                                    <p>Property Type: ${property.PropertyType}</p>
                                </a></li>`;
            }
            listProperty += `</ul>`;

            // Add list to UI.
            $('#list-property').empty().append(listProperty).listview('refresh').trigger('create');

            log(`Show list of properties successfully.`);
        }
    });
}

// Save Property Id.
$(document).on('vclick', '#list-property li a', function (e) {
    e.preventDefault();

    var id = $(this).data('details').Id;
    localStorage.setItem('currentPropertyId', id);

    $.mobile.navigate('#page-detail', { transition: 'none' });
});

// Show Property Details.
$(document).on('pagebeforeshow', '#page-detail', showDetail);

function showDetail() {
    var id = localStorage.getItem('currentPropertyId');

    db.transaction(function (tx) {
        var query = `SELECT Property.*, City.Name AS City, District.Name AS District, Ward.Name AS Ward
        FROM Property
        LEFT JOIN City ON City.Id = Property.City
        LEFT JOIN District ON District.Id = Property.District
        LEFT JOIN Ward ON Ward.Id = Property.Ward WHERE Property.Id = ?`;

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var errorMessage = 'Property not found.';
            var propertyname = errorMessage;
            var propertyaddress = errorMessage;
            var city = errorMessage;
            var district = errorMessage;
            var ward = errorMessage;
            var propertytype = errorMessage;
            var bedroom = errorMessage;
            var date =  errorMessage;
            var rentprice = errorMessage;
            var furnituretype = errorMessage;
            var note = errorMessage;
            var reporter = errorMessage;

            if (result.rows[0] != null) {
                log(`Get details of property '${id}' successfully.`);
                
                propertyname = result.rows[0].PropertyName;
                propertyaddress = result.rows[0].PropertyAddress;
                city = result.rows[0].City;
                district = result.rows[0].District;
                ward = result.rows[0].Ward;
                propertytype = result.rows[0].PropertyType;
                bedroom = result.rows[0].Bedrooms;
                date = (result.rows[0].Date);
                rentprice = result.rows[0].RentPrice;
                furnituretype = result.rows[0].FurnitureType;
                note = result.rows[0].Note;
                reporter = result.rows[0].Reporter;
                
            }
            else {
                log(errorMessage, ERROR);

                $('#page-detail #btn-update').addClass('ui-disabled');
                $('#page-detail #btn-delete-confirm').addClass('ui-disabled');
            }

            $('#page-detail #id').text(id);
            $('#page-detail #property-name').text(propertyname);
            $('#page-detail #property-address').text(propertyaddress);
            $('#page-detail #city').text(city);
            $('#page-detail #district').text(district);
            $('#page-detail #ward').text(ward);
            $('#page-detail #property-type').text(propertytype);
            $('#page-detail #bedroom').text(bedroom);
            $('#page-detail #date').text(date);
            $('#page-detail #rent-price').text(rentprice);
            $('#page-detail #furniture-type').text(furnituretype);
            $('#page-detail #note').text(note);
            $('#page-detail #reporter').text(reporter);
            
            showNote();
        }
    });
}

// Delete Property.
$(document).on('submit', '#page-detail #frm-delete', deleteProperty);
$(document).on('keyup', '#page-detail #frm-delete #txt-delete', confirmDeleteProperty);

function confirmDeleteProperty() {
    var text = $('#page-detail #frm-delete #txt-delete').val();

    if (text == 'confirm delete') {
        $('#page-detail #frm-delete #btn-delete').removeClass('ui-disabled');
    }
    else {
        $('#page-detail #frm-delete #btn-delete').addClass('ui-disabled');
    }
}

function deleteProperty(e) {
    e.preventDefault();

    var id = localStorage.getItem('currentPropertyId');

    db.transaction(function (tx) {
        var query = 'DELETE FROM Property WHERE Id = ?';
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Delete property '${id}' successfully.`);

            $('#page-detail #frm-delete').trigger('reset');

            $.mobile.navigate('#page-list', { transition: 'none' });
        }
    });
}

//Update prop
$(document).on('vclick', '#page-detail #btn-update', showUpdate);
$(document).on('submit', '#page-detail #frm-update', updateProperty);
$(document).on('vclick', '#page-detail #frm-update #btn-cancel', function () {
    $('#page-detail #frm-update').popup('close');
});

$(document).on('change', '#page-detail #frm-update #city', function () {
    UpdateDistrict($('#page-detail #frm-update #district'), this.value);
    UpdateWard($('#page-detail #frm-update #ward'), -1);
});

$(document).on('change', '#page-detail #frm-update #district', function () {
    UpdateWard($('#page-detail #frm-update #ward'), this.value);
});

function UpdateCity(selectedId = -1){
    db.transaction(function (tx) {

        var query = `SELECT * FROM City ORDER BY Name`;
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of City successfully.`);

            var optionList = `<option value='-1'>Select City</option>`;
            for (let item of result.rows){
                
                optionList += `<option value='${item.Id}' ${item.Id == selectedId ? 'selected' : ''}>${item.Name}</option>`;
            }
            
            $('#page-detail #frm-update #city').html(optionList);
            $('#page-detail #frm-update #city').selectmenu('refresh', true);
        }
    });
}

function UpdateDistrict(selectedId = -1, cityId){
    if (cityId == null) {
        cityId = $('#page-detail #frm-update #city').val();
    }
    
    db.transaction(function (tx) {
        log('Get list of District successfully');
        log(cityId);
        var query = `SELECT * FROM District WHERE CityId = ? ORDER BY Name`;
        tx.executeSql(query, [cityId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var optionList = `<option value='-1'>Select District</option>`;
            for (let item of result.rows){
                optionList += `<option value='${item.Id}' ${item.Id == selectedId ? 'selected' : ''}>${item.Name}</option>`;
            }

            $('#page-detail #frm-update #district').html(optionList);
            $('#page-detail #frm-update #district').selectmenu('refresh', true);
        }
    });
}

function UpdateWard(selectedId = -1, districtId){    
    if (districtId == null) {
        districtId = $('#page-detail #frm-update #district').val();
    }
    
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Ward WHERE DistrictId = ? ORDER BY Name';
        tx.executeSql(query, [districtId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var optionList = `<option value='-1'>Select Ward</option>`;
            for (let item of result.rows){
                optionList += `<option value='${item.Id}' ${item.Id == selectedId ? 'selected' : ''}>${item.Name}</option>`;
            }

            $('#page-detail #frm-update #ward').html(optionList);
            $('#page-detail #frm-update #ward').selectmenu('refresh', true);
        }
    });
}

function showUpdate() {
    var id = localStorage.getItem('currentPropertyId');

    db.transaction(function (tx) {
        var query = `SELECT * FROM Property WHERE Id = ?`;

        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] != null) {
                log(`Get details of property '${result.rows[0].Name}' successfully.`);
                                
                $(`#page-detail #frm-update #property-name`).val(result.rows[0].PropertyName);
                $(`#page-detail #frm-update #property-address`).val(result.rows[0].PropertyAddress);
                $(`#page-detail #frm-update #type`).val(result.rows[0].PropertyType);
                $(`#page-detail #frm-update #rent-price`).val(result.rows[0].RentPrice);
                $(`#page-detail #frm-update #furtype`).val(result.rows[0].FurnitureType);
                $(`#page-detail #frm-update #bedrooms`).val(result.rows[0].Bedrooms);
                $(`#page-detail #frm-update #reporter`).val(result.rows[0].Reporter);

                UpdateCity(result.rows[0].City);
                UpdateDistrict(result.rows[0].District, result.rows[0].City);
                UpdateWard(result.rows[0].Ward, result.rows[0].District);

                //log(result.rows[0].PropertyType);                
                //$(`#page-detail #frm-update #property-type`).val(result.rows[0].PropertyType);
                //$(`#page-detail #frm-update #propertytype :selected`).val(result.rows[0].PropertyType);
                
                //changePopup($('#page-detail #option'), $('#page-detail #frm-update'));
                checkUpdateProperty(propertyname, propertyaddress, city, district, ward, propertytype, bedroom, rentprice, furnituretype, reporter);
            }
        }
    });
}

function checkUpdateProperty(propertyname, propertyaddress, city, district, ward, propertytype, bedroom, rentprice, furnituretype, reporter) {
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Property WHERE PropertyName = ?';
        tx.executeSql(query, [propertyname], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] == null) {
                $('#page-create #error').empty();

                $('#page-detail #frm-update #property-name').val(propertyname);
                $('#page-detail #frm-update #property-address').val(propertyaddress);
                $('#page-detail #frm-update #city').val(city);
                $('#page-detail #frm-update #district').val(district);
                $('#page-detail #frm-update #ward').val(ward);
                $('#page-detail #frm-update #type').val(propertytype);
                $('#page-detail #frm-update #bedrooms').val(bedroom);
                $('#page-detail #frm-update #rent-price').val(rentprice);
                $('#page-detail #frm-update #furtype').val(furnituretype);
                $('#page-detail #frm-update #reporter').val(reporter);

                updateProperty();
            }
            else {
                var error = 'Property exists.';
                $('#page-create #error').empty().append(error);
                log(error, ERROR);
            }
        }
    });
}

function updateProperty(e) {
    e.preventDefault();

    var id = localStorage.getItem('currentPropertyId');
    var propertyname = $('#page-detail #frm-update #property-name').val();
    var propertyaddress = $('#page-detail #frm-update #property-address').val();
    var city = $('#page-detail #frm-update #city').val();
    var district = $('#page-detail #frm-update #district').val();
    var ward = $('#page-detail #frm-update #ward').val();
    var propertytype = $('#page-detail #frm-update #type').val();
    var bedroom = $('#page-detail #frm-update #bedrooms').val();
    var date = new Date();
    var rentprice = $('#page-detail #frm-update #rent-price').val();
    var furnituretype = $('#page-detail #frm-update #furtype').val();
    var reporter = $('#page-detail #frm-update #reporter').val();


    db.transaction(function (tx) {
        var query = `UPDATE Property
                    SET PropertyName = ?,
                        PropertyAddress = ?, City = ?, District = ?, Ward = ?,
                        PropertyType = ?, Bedrooms = ?, RentPrice = ?, FurnitureType = ?, Reporter = ?,
                        Date = ?
                    WHERE Id = ?`;

        tx.executeSql(query, [propertyname, propertyaddress, city, district, ward, propertytype, bedroom, rentprice, furnituretype, reporter, date, id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Update property '${propertyname}' successfully.`);

            showDetail();

            $('#page-detail #frm-update').popup('close');
        }
    });    
}

// Add Comment.
$(document).on('submit', '#page-detail #frm-note', addNote);

function addNote(e) {
    e.preventDefault();

    var propertyId = localStorage.getItem('currentPropertyId');
    var note = $('#page-detail #frm-note #txt-note').val();
    var date = new Date();

    db.transaction(function (tx) {
        var query = 'INSERT INTO Note (PropertyId, Note, DateTime) VALUES (?, ?, ?)';
        tx.executeSql(query, [propertyId, note, date], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Add new note to property '${propertyId}' successfully.`);

            $('#page-detail #frm-note').trigger('reset');

            showNote();
        }
    });
}

// Show Comment.
function showNote() {
    var propertyId = localStorage.getItem('currentPropertyId');

    db.transaction(function (tx) {
        var query = `SELECT Note, DateTime FROM Note WHERE PropertyId = ?`;
        tx.executeSql(query, [propertyId], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of notes successfully.`);

            // Prepare the list of comments.
            var listNote = '';
            for (let note of result.rows) {
                listNote += `<div class = 'list'>
                                    <small>${(note.DateTime).substring(0, query.length - 28)}</small>
                                    <h3>${note.Note}</h3>
                                </div>`;
            }
            
            // Add list to UI.
            $('#list-note').empty().append(listNote);

            log(`Show list of notes successfully.`);
        }
    });
}

//Search
$(document).on('submit', '#page-search #frm-search', Search);
$(document).on('vclick', '#page-search #frm-search #btn-clear', function () {
    $('#frm-search').trigger('reset');
    $('#page-search #error').empty();
    $('#page-search #list-property').empty();
});

function Search(e){
    e.preventDefault();

    var propertytype = $('#page-search #frm-search #property-type').val();
    var reporter = $('#page-search #frm-search #reporter').val();
    var propertyadd =  $('#page-search #frm-search #propadd').val();
    var rentprice = $('#page-search #frm-search #rent-price').val();

    db.transaction(function (tx) {
        var query = `SELECT Id, PropertyName, PropertyType, PropertyAddress FROM Property WHERE`;
        
        if (propertytype) {
            query += ` PropertyType = "${propertytype}"   OR`;
        }
        
        if (propertyadd) {
            query += ` PropertyAddress LIKE "%${propertyadd}%"   AND`;
            log(query);
        }
        
        if (reporter) {
            query += ` Reporter LIKE "%${reporter}%"   AND`;
        }

        if (rentprice) {
            query += ` RentPrice > ${rentprice}   AND`;
        }

        //Cắt chuỗi - substring(bắt đầu, kết thúc)
        query = query.substring(0, query.length - 6);
        
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of accounts successfully.`);

            // Prepare the list of accounts.
            var listProperty = `<ul id='list-property' data-role='listview'
                                                     data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for (let property of result.rows) {
                listProperty += `<li><a data-details='{"Id" : ${property.Id}}'>
                                    <h3>Property Name: ${property.PropertyName}</h3>
                                    <p>Property Address: ${property.PropertyAddress}</p>
                                    <p>Property Type: ${property.PropertyType}</p>
                                </a></li>`;
            }
            listProperty += `</ul>`;

            // Add list to UI.
            $('#page-search #list-property').empty().append(listProperty).listview('refresh').trigger('create');

            log(`Show list of accounts successfully.`);
        }
    });
    

}