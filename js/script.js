var sheetID = "1JO8mApODrb6Q8R72CM6g_pgxQYj62rR9Lsq3uNvbz3U"; // google sheet ID
var sheetQuery = "select A, B, C, D"; // queried columns
var ticketPattern = "/[\d]{6}/"; // display pattern of the raffle tickets
var toastDuration = 2500; // how long the toast message should appear
var input_arr = []; // input storage
var tixNum = 1;
var valid = {
    legalChar: {regex:/[^0-9]/, msg:"Please Put in Numbers Only"},
    legalCharAdv: {regex:/[^0-9,-]/, msg:"Use Numbers, \",\" and \"-\" Only"},
    pattern: {regex:/^(?![\d]{6})./, msg:"Ticket Pattern Doesn't Match"},
    pattern_range: {regex:/^(?![\d]{6}-[\d]{6})./, msg:"Ranged Ticket Pattern Doesn't Match"}
}

// Retrieve Google Sheets Data
var jsonp = function(url){
    var script = window.document.createElement('script');
    script.async = true;
    script.src = url;
    script.onerror = function(){
        alert('Can not access JSONP file.')
    };
    var done = false;
    script.onload = script.onreadystatechange = function(){
        if (!done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete')){
            console.log("Loading Complete");
            done = true;
            script.onload = script.onreadystatechange = null;
            if (script.parentNode){
                return script.parentNode.removeChild(script);
            }
        }
    };
    window.document.getElementsByTagName('head')[0].appendChild(script);
};

jsonp("https://spreadsheets.google.com/a/google.com/tq?key=" + sheetID + "&tq=" + encodeURIComponent(sheetQuery) + "&tqx=responseHandler:callback");


function callback(data){
    var rows = data.table.rows;
    var table = [];
    var label = _.pluck(data.table.cols,"label");
    
    for(var row in rows){
        var cols = rows[row].c;
        var content = {};
        
        for(var col in cols){
            var cell = (cols[col]==null)?null:cols[col].v;
            content[label[col]] = cell;
        }
        table.push(content);
    }
    
    buildTable(label,table);
}

function buildTable(labels,table){
    $(function(){
        console.log(labels);
        console.log(table);
        
        // Init Modals
        $(".modal").modal();
                
        // Tab Traverse
        $(".tabNav").on("click",function(){
            var targetTab = $(this).data("tab_target");
            $(".tabs").tabs("select_tab", targetTab);
        })
        
        // Tab Switch Handler
        $(".tabs").tabs({
            onShow: function(e){                
                var activeTab = e[0].id;
                
                switch (activeTab){
                    case "tab1":
                        $("header h4").text("Raffle Search");
                        $("header h6").text("Enter your ticket(s) to find out the prizes you win!");
                        break;
                    case "tab2":
                        $("header h4").text("Advanced Search");
                        $("header h6").text("Speed up the search by entering all tickets at once");
                        break;
                    case "tab3":
                        $("header h4").text("All Raffle Prizes");
                        $("header h6").text("Click on the table header to resort the prizes");
                        break;
                }
            }
        });
                
        // Build Table Header
        $("#rafflePrize thead, #rafflePrize_adv thead, #rafflePrize_static thead").append("<tr>");
        $.each(labels,function(key,label){
            $("#rafflePrize thead tr, #rafflePrize_adv thead tr, #rafflePrize_static thead tr").append("<th>"+ label +"</th>");
        })
        
        // Buidl Table Body
        $.each(table,function(num, row){
            
            var rowhtml = "<tr>";
            $.each(row,function(key,cell){
                rowhtml += "<td>"+cell+"</td>";
            })      
            rowhtml += "</tr>";
            
            $("#rafflePrize tbody, #rafflePrize_adv tbody, #rafflePrize_static tbody").append(rowhtml);
        })
        
        // Init Datatable
        var prizeTable = $("#rafflePrize").DataTable({
            dom: "t",
            paging: false,
            order: [[ 0, "asc" ]]
        });
        var prizeTable_adv = $("#rafflePrize_adv").DataTable({
            dom: "t",
            paging: false,
            order: [[ 0, "asc" ]]
        });
        var prizeTable_static = $("#rafflePrize_static").DataTable({
            dom: "t",
            paging: false,
            order: [[ 0, "asc" ]]
        });
        
        // Regular Search - Add Tickets
        $(".addTix button").on("click",function(){ addTickets($(this)) });
        function addTickets(e){
            tixNum++;
            
            // Append New HTML
            var newTix = "<div id='tix_" + tixNum + "' class='row'>"+
                            "<span class='col s3 check'><input type='checkbox' id='tix_type_" + tixNum + "' class='filled-in' checked='checked'><label for='tix_type_" + tixNum + "'>Range</label></span>"+
                            "<input type='number' class='tix start center col s3' placeholder='start'>"+
                            "<span class='col s1 to'>to</span>"+
                            "<input type='number' class='tix end center col s3' placeholder='end'>"+
                            "<span class='col s1 addTix'><button class='btn-floating waves-effect waves-light'><i class='material-icons'>add</i></button></span>"+
                         "</div>";
            $("#tickets").append(newTix);
            
            // Change Appearance
            $(e).off("click");
            $(e).parent().removeClass("addTix").addClass("removeTix");
            $(e).html("<i class='material-icons'>remove</i>");
            
            // Assign Click Handlers
            $(".addTix button").on("click",function(){ addTickets($(this)) });
            $(".removeTix button").on("click",function(){ removeTickets($(this)) });
            $("#tix_" + tixNum + " input[type='checkbox']").on("click", function(){rangeTypeHandler($(this))} );
        }
        
        // Regular Search - Remove Tickets
        $(".removeTix button").on("click",function(){ removeTickets($(this)) });
        function removeTickets(e){
            
            // Remove
            $(e).parents(".row[id^='tix_']").remove();
        }
        
        // Regular Search - Range Type Change
        $("input[type='checkbox'][id^='tix_type']").on("click", function(){rangeTypeHandler($(this))} );
        function rangeTypeHandler(e){
            $(e).parent().siblings("input.end").val("");
            if($(e).is(":checked")){
                $(e).parent().siblings("input.end").removeClass("fade");
                $(e).parent().siblings("input.start").attr("placeholder","start");
                $(e).parent().siblings("span.s1.to").removeClass("fade");
                $(e).siblings("label").text("Range");
            }else{
                $(e).parent().siblings("input.end").addClass("fade");
                $(e).parent().siblings("input.start").attr("placeholder","ticket");
                $(e).parent().siblings("span.s1.to").addClass("fade");
                $(e).siblings("label").text("Single");
            }
        }
        
        // Regular Search
        $("#search").on("click",function(){            
            // Validation Rules:
            // + Only accepts number
            // + (optional) Should match ticket pattern
            // + End cannot be empty if start has value to form a range
            // + Start can be empty
            // + At least one field has to have something
            input_arr = [];
            
            // Gather all data
            for(var i = 1 ; i <= tixNum ; i++){
                var tixStart = $("#tix_"+i+" input.start[type='number']").val();
                var tixEnd = $("#tix_"+i+" input.end[type='number']").val();
                
                if(tixStart){
                    if(validate(tixStart,"legalChar",true)){
                        if(validate(tixStart,"pattern",true)){
                            if($("input#tix_type_"+i+"[type='checkbox']").is(":checked")){
                                // Range Tickets
                                if(tixEnd){
                                    if(validate(tixEnd,"legalChar",true)){
                                        if(validate(tixEnd,"pattern",true)){
                                            input_arr = input_arr.concat(rangeTickets(tixStart,tixEnd));
                                        }
                                    }
                                }else{
                                    Materialize.toast("Enter an End Value to Form a Range",toastDuration,"rounded");
                                }
                            }else{
                                // Single Tickets
                                input_arr.push(tixStart);
                            }
                        }
                    }                    
                }
            }
            console.log(input_arr);
            if(input_arr.length > 0){
                var filter = RegExp("/"+input_arr.join("|")+"/");
                prizeTable.search(filter,true,false).draw();
            }
        })
        
        // Search Callback
        prizeTable.on("search.dt",function(e,settings){ searchHandler(settings,false) });
        prizeTable_adv.on("search.dt",function(e,settings){ searchHandler(settings,true) });
                
        // Advanced Search - Grab User Input
        $("#advSearch").on("click",function(e){            
            input_arr = [];
            
            var input_raw = $("#tickets_adv").val().replace(/\s/,"");
            
            if(input_raw && validate(input_raw,"legalCharAdv",true)){
                var input_raw_arr = input_raw.split(",");
                $.each(input_raw_arr,function(index,ticket){
                    if(validate(ticket,"pattern_range",false)){
                        console.log(ticket);
                        // Ranged Ticket
                        ticketRange = ticket.split("-");
                        input_arr = input_arr.concat(rangeTickets(ticketRange[0],ticketRange[1]));
                    }else if(validate(ticket,"pattern",false)){
                        console.log(ticket);
                        // Single Ticket
                        input_arr.push(ticket.toString());
                    }else{
                        console.log(ticket);
                        Materialize.toast("Ticket Pattern Incorrect!",toastDuration,"rounded");
                    }
                })
                console.log(input_arr);
                
                if(input_arr.length > 0){
                    var filter = RegExp("/"+input_arr.join("|")+"/");
                    prizeTable_adv.search(filter,true,false).draw();
                }
            }
        })
        
        // Search Callback Handler
        function searchHandler(settings, adv){
            console.log(settings);
            
            var win = settings.aiDisplay.length;
            var tableType = (adv)?"_adv":"";
            
            if(win > 0){
                $("#modal_prize").modal("open");
                $("#modal_prize .modal-content p").html("<b>"+win+"</b> ticket(s) have matching prizes according to our list!<br>Scroll down for the ticket number to claim your prize(s).");
                $("#tableContainer"+tableType).removeClass("hide");
                $("#thankYou"+tableType).addClass("hide");
            }else{
                $("#tableContainer"+tableType).addClass("hide");
                $("#thankYou"+tableType).removeClass("hide");
                $("#thankYou"+tableType+" span").text(input_arr.length);
                $("#listAllTix"+tableType).html(input_arr.join(", "));
            }
        }
        
        // Validation Checker
        function validate(input,type,toast){
            if((valid[type].regex).test(input)){
                if(toast){Materialize.toast(valid[type].msg,toastDuration,"rounded")};
                return false;
            }else{
                return true;
            }
        }
        
        // Fill-in Inbetween Tickets
        function rangeTickets(a,b){
            var result = new Array();
            if(a > b){ [a, b] = [b, a] }; // Swapping Order so That a < b
            for(i=a; i<=b; i++){ result.push(i) };
            
            // Handling Cases for "000010"
            result = leadingZero(result);
            
            return result;
        }
        
        // Deal with Leading Zero
        function leadingZero(arr){
            var res = [];
            $.each(arr, function(key,item){
                res.push(zeroFill(item,6));
            })
            return res;
        }
        
        // Fill in Zeros
        function zeroFill(n, w){
            return (n.toString().length >= w )?n.toString():(new Array(w).join('0') + n.toString()).substr(-w);
        }
        
        // Copyright
        var currentYear = new Date().getFullYear();
        var startYear = 2017;
        var cp = (currentYear == startYear)?currentYear:startYear+"-"+currentYear;
        $(".footer-copyright").text("© "+cp+" Rafful App, All rights reserved.");
    })
}