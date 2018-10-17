let agregarInput = function() {
    let cantInputs = $(".group-producto").length + 1;
    let placeholder = "Producto " + cantInputs;
    $(".inputs-busqueda").append('<div class="input-group group-producto my-2">' +
        '<div class="input-group-prepend">' + 
        '<span class="input-group-text">' + placeholder + '</span>' +
        '</div>' +
        '<input type="text" class="form-control input-producto" placeholder="' + placeholder + '" aria-label="' + placeholder + '" required>' +
        '</div>');
};
let quitarInput = function() {
    let cantInputs = $(".group-producto").length;
    if (cantInputs > 2) {
        $(".group-producto").last().remove();
    }
};
let getProductos = function(arrayData, queries, offset, limite = 500) {
    $.ajax({
        type: 'GET',
        url: 'https://api.mercadolibre.com/sites/MLA/search?q=' + queries[0] + '&offset=' + offset,
        dataType: 'json',
        cache: false
    }).done(function(data) {
        if (offset == 0) {
            arrayData.push(data);
            offset += 50;
        } else if (offset >= limite) {
            queries.shift();
            offset = 0;
            arrayData[arrayData.length-1]["results"].push(...data["results"]);
        } else {
            offset += 50;
            arrayData[arrayData.length-1]["results"].push(...data["results"]);
        }
        if (queries.length > 0) {
            getProductos(arrayData, queries, offset, limite);
        } else {
            filtrarProductos(arrayData);
        }
    });
};
let filtrarProductos = function(arrayData) {
    console.log(arrayData);
    let idsVendedores = new Set();
    for (let dataIndex in arrayData) {
        let idsData = new Set();
        let data = arrayData[dataIndex];
        for (let resultIndex in data["results"]) {
            let result = data["results"][resultIndex];
            idsData.add(result["seller"]["id"]);
        }
        console.log("DATA INDEX: " + dataIndex);
        if (dataIndex == 0) {
            idsVendedores = new Set([...idsVendedores, ...idsData]);
            console.log(idsVendedores);
        } else {
            idsVendedores = new Set([...idsVendedores].filter(x => idsData.has(x)));
        }
    }
    idsVendedores = Array.from(idsVendedores);
    console.log(idsVendedores);
    let productosVendedor = [];
    for (let indexVendedor in idsVendedores) {
        productosVendedor.push({id:idsVendedores[indexVendedor], productos: []});
    }
    for (let dataIndex in arrayData) {
        let data = arrayData[dataIndex];
        for (let resultIndex in data["results"]) {
            let result = data["results"][resultIndex];
            let indexObjetoPV = productosVendedor.findIndex(pv => pv["id"] === result["seller"]["id"]);
            if (indexObjetoPV !== -1) {
                let indexProd = productosVendedor[indexObjetoPV]["productos"].findIndex(p => p["id"] === result["id"]);
                if (indexProd === -1) {
                    productosVendedor[indexObjetoPV]["productos"].push(result);
                }
            }
        }
    }
    console.log(productosVendedor);
    $(".loader").remove();
    if (productosVendedor.length > 0) {
        mostrarProductos(productosVendedor);
    } else {
        $(".resultados").append('<h3>No se encontraron coincidencias</h3>');
    }
};
let mostrarProductos = function(productosVendedor) {
    $.ajax({
        type: 'GET',
        url: 'https://api.mercadolibre.com/users/' + productosVendedor[0]["id"],
        dataType: 'json',
        cache: false
    }).done(function(data) {
        let nombreVendedor = data["nickname"];
        $(".resultados").append('<h3 class="my-2">' + nombreVendedor + '</h3><div class="row fila-productos"></div>');
        for (indexProducto in productosVendedor[0]["productos"]) {
            let nombre = productosVendedor[0]["productos"][indexProducto]["title"];
            let precio = "$ " + productosVendedor[0]["productos"][indexProducto]["price"];
            let thumbnail = productosVendedor[0]["productos"][indexProducto]["thumbnail"];
            let imagen = thumbnail.replace("-I.jpg","-Q.jpg");
            let enlace = productosVendedor[0]["productos"][indexProducto]["permalink"];
            $(".fila-productos").last().append('<div class="col-sm-4 col-md-3">' +
                '<div class="card my-2">' +
                '<img class="card-img-top" src="' + imagen + '">' +
                '<div class="card-body">' +
                '<p class="card-title">' + precio + '</p>' +
                '<a href="' + enlace + '" target="_blank"><p class="card-text">' + nombre + '</p></a>' +
                '</div></div></div>');
        }
        productosVendedor.shift();
        if (productosVendedor.length > 0) {
            mostrarProductos(productosVendedor);
        }
    });
};
$(document).ready(function() {
    $(".form-busqueda").submit(function(event) {
        event.preventDefault();
        $(".resultados").empty();
        let queries = $(".input-producto").map(function() {
            return this.value;
        }).get();
        let limite =  $(".input-limite").val();
        $(".resultados").after('<div class="loader">Cargando...</div>');
        getProductos([], queries, 0, limite);
    });
});
