import WMS from "./WMS.js";
import Utils from "./Utils.js";
import FeaturesTable from "./FeaturesTable.js";

// ID of the dock (do not change)
const DOCK_ID = 'item-features-view';
// Icon of the dock menu and used before each link
// See https://getbootstrap.com/2.3.2/base-css.html#icons
const DOCK_ICON = 'icon-search';
// Dock position: minidock
const DOCK_POSITION = 'minidock';
// Title of the dock
const DOCK_TITLE = 'Item viewer';
// Description displayed at the top of the dock content
const DOCK_DESCRIPTION = 'You can view the current item clicked.';
// Sentence used when no click has been made on the map yet
const DOCK_PLEASE_CLICK = 'Please click on the map to get the item you want to show.';

// -------------------------------------*
// DO NOT EDIT AFTER THIS LINE          |
// IMPORT IN Lizmap.js in order to test |
// -------------------------------------*

// Object used to store information o create the popup
let popupObject = {
    layerId: null,
    listFeature: [],
    uniqueField: null,
    element: null,
}
// Index for the current position in the list of features
let indexListFeature = 0;

let featuresTables;

/**
 * Add the Lizmap dock with the links
 * every time the user clicks on the map
 * @param {boolean} callback - If the dock is opened by a click on the map
 * @returns {string} HTML content of the dock
 */
function buildHtml(callback = false) {
    let dockHtml = '';
    dockHtml += `<p style="padding: 5px;">${DOCK_DESCRIPTION}</p>`;
    if (callback) {
        if (!document.querySelector("#" + DOCK_ID + "-container-buttons")) {
            document.querySelector("div.item-features-view > .menu-content").insertAdjacentHTML('beforeend', `
              <div id="` + DOCK_ID + `-container-buttons" style="display: flex;justify-content: space-around;">
                <button id="` + DOCK_ID + `-beforeButton" type="button" class="btn btn-outline-primary btn-sm" style="width: 45%">Précédent</button>
                <button id="` + DOCK_ID + `-nextButton" type="button" class="btn btn-outline-primary btn-sm" style="width: 45%">Suivant</button>
              </div>
            `);

            document.getElementById(DOCK_ID + "-beforeButton").addEventListener('click', () => {
                indexListFeature --;
                if (indexListFeature < 0) {
                    indexListFeature = popupObject.listFeature.length - 1;
                }
                popupObject.element = popupObject.listFeature[indexListFeature];
                openPopup(popupObject);
            });

            document.getElementById(DOCK_ID + "-nextButton").addEventListener('click', () => {
                indexListFeature ++;
                if (indexListFeature >= popupObject.listFeature.length) {
                    indexListFeature = 0;
                }
                popupObject.element = popupObject.listFeature[indexListFeature];
                openPopup(popupObject);
            });
        }
    } else {
        dockHtml += `<p style="padding: 5px; font-style: italic; font-size: 0.8em; background: lightgray;">${DOCK_PLEASE_CLICK}</p>`;
    }

    return dockHtml;
}

/**
 * DEBUG FUNCTION
 * This function is used to display the geometry of the feature clicked in red
 */
function debugColor() {
    for (let layer of lizMap.mainLizmap.map.getAllLayers()) {
        if (layer.getProperties().hasOwnProperty('DEBUG')) {
            lizMap.mainLizmap.map.removeLayer(layer);
            break;
        }
    }

    let multipolygon = new lizMap.ol.geom.MultiPolygon(popupObject.listFeature[indexListFeature].geometry.coordinates);
    let layer = new lizMap.ol.layer.Vector({
        source: new lizMap.ol.source.Vector({
            features: [new lizMap.ol.Feature(multipolygon)]
        }),
        style: new lizMap.ol.style.Style({
            stroke: new lizMap.ol.style.Stroke({
                color: 'red',
                width: 3,
            }),
            fill: new lizMap.ol.style.Fill({
                color: 'rgba(255,0,0,0.1)',
            }),
        }),
    });
    layer.setProperties({DEBUG: 'debug'});
    lizMap.mainLizmap.map.addLayer(layer);
}

/**
 * Create and add the new dock in Lizmap Web Client interface
 */
function addLinkDock() {
    const content = buildHtml();
    const html = `
        <div id="lizmap-` + DOCK_ID + `" style="font-size: 11pt;">
            ${content}
        </div>
    `;
    lizMap.addDock(
        DOCK_ID, DOCK_TITLE, DOCK_POSITION, html, DOCK_ICON
    );
    document.querySelector("div.item-features-view > .menu-content").style.width = "fit-content";
}

/**
 * Extract lizmap features table attributes that are necessary to build the popup
 * @param {object} event - Click event
 * @returns {Promise<object>} - Feature object with parameters
 */
async function getParams(event) {
    const xCoordinate = event?.xy?.x || event?.pixel?.[0];
    const yCoordinate = event?.xy?.y || event?.pixel?.[1];

    // Order popups following layers order
    let candidateLayers = lizMap.mainLizmap.state.rootMapGroup.findMapLayers().toSorted((a, b) => b.layerOrder - a.layerOrder);

    // Only request visible layers
    candidateLayers = candidateLayers.filter(layer => layer.visibility);

    // Only request layers with 'popup' checked in plugin
    // Or some edition capabilities
    candidateLayers = candidateLayers.filter(layer => {
        const layerCfg = layer.layerConfig;

        let editionLayerCapabilities;

        if (lizMap.mainLizmap.initialConfig?.editionLayers?.layerNames.includes(layer.name)) {
            editionLayerCapabilities = lizMap.mainLizmap.initialConfig?.editionLayers?.getLayerConfigByLayerName(layer.name)?.capabilities;
        }
        return layerCfg.popup || editionLayerCapabilities?.modifyAttribute || editionLayerCapabilities?.modifyGeometry || editionLayerCapabilities?.deleteFeature;
    });

    const layersNames = [];
    const layersStyles = [];
    const filterTokens = [];
    const legendOn = [];
    const legendOff = [];
    let popupMaxFeatures = 10;
    for (const layer of candidateLayers) {
        const layerWmsParams = layer.wmsParameters;
        // Add layer to the list of layers
        layersNames.push(layerWmsParams['LAYERS']);
        // Optionally add layer style if needed (same order as layers )
        layersStyles.push(layerWmsParams['STYLES']);
        if ('FILTERTOKEN' in layerWmsParams) {
            filterTokens.push(layerWmsParams['FILTERTOKEN']);
        }
        if ('LEGEND_ON' in layerWmsParams) {
            legendOn.push(layerWmsParams['LEGEND_ON']);
        }
        if ('LEGEND_OFF' in layerWmsParams) {
            legendOff.push(layerWmsParams['LEGEND_OFF']);
        }
        if (layer.layerConfig.popupMaxFeatures > popupMaxFeatures) {
            popupMaxFeatures = layer.layerConfig.popupMaxFeatures;
        }
    }

    const wms = new WMS();

    const [width, height] = lizMap.mainLizmap.map.getSize();

    let bbox = lizMap.mainLizmap.map.getView().calculateExtent();

    if (lizMap.mainLizmap.map.getView().getProjection().getAxisOrientation().substring(0, 2) === 'ne') {
        bbox = [bbox[1], bbox[0], bbox[3], bbox[2]];
    }

    const wmsParams = {
        QUERY_LAYERS: layersNames.join(','),
        LAYERS: layersNames.join(','),
        STYLE: layersStyles.join(','),
        CRS: lizMap.mainLizmap.projection,
        BBOX: bbox,
        WIDTH: width,
        HEIGHT: height,
        FEATURE_COUNT: 1,
        I: Math.round(xCoordinate),
        J: Math.round(yCoordinate),
        FI_POINT_TOLERANCE: 0,
        FI_LINE_TOLERANCE: 0,
        FI_POLYGON_TOLERANCE: 0
    };

    if (filterTokens.length) {
        wmsParams.FILTERTOKEN = filterTokens.join(';');
    }
    if (legendOn.length) {
        wmsParams.LEGEND_ON = legendOn.join(';');
    }
    if (legendOff.length) {
        wmsParams.LEGEND_OFF = legendOff.join(';');
    }

    document.getElementById('newOlMap').style.cursor = 'wait';

    return await wms.getFeatureInfo(wmsParams).then(response => {
        let text = Utils.sanitizeGFIContent(response);

        // SIMULATE lizmap-field FOR TESTING
        if (text.includes("</lizmap-features-table>")) {
            const description = "Ceci est un label de ce tableau"
            const textSplit = text.split('</lizmap-features-table>');

            text = textSplit[0];

            for (let i = 1; i < textSplit.length; i++) {
                text +=
                  '<lizmap-field data-alias="Code quartier" ' +
                  'data-description="' + description + '"' +
                  '>' +
                  '"quartmno"' +
                  '</lizmap-field>' +
                  '<lizmap-field data-alias="Nom du quartier" ' +
                  'data-description="' + description + '"' +
                  '>' +
                  '"libsquart"' +
                  '</lizmap-field>' +
                  '</lizmap-features-table>' + textSplit[i];
            }
        }

        if (text.length < 1) {
            return null;
        }
        const stringHTML = text.split("lizmap-features-table")[1];
        const HTMLObject = new DOMParser().parseFromString(`<lizmap-features-table${stringHTML}lizmap-features-table>`, 'text/html');
        const selector = HTMLObject.querySelector('lizmap-features-table');

        let feature = {
            layerTitle: selector.getAttribute('layertitle'),
            layerId: selector.getAttribute('layerid'),
            uniqueField: selector.getAttribute('uniquefield'),
            expressionFilter: selector.getAttribute('expressionfilter'),
            withGeometry: (selector.getAttribute('withgeometry') === "1"),
            sortingField: selector.getAttribute('sortingfield'),
            sortingOrder: selector.getAttribute('sortingorder'),
            fields: [],
        };

        return feature
    }).finally(() => {
        document.getElementById('newOlMap').style.cursor = 'auto';
    });
}

/**
 * Get the feature from the map click event and open the popup
 * @param {MouseEvent} event - Click event
 * @returns {Promise<void>} - Open the popup or display an error message
 */
async function onMapClick(event) {
    // Update panel only if active
    if (document.getElementById(DOCK_ID).classList.contains('active')) {

        // Get parameters of the feature
        let feature = await getParams(event);

        if (!feature) {
            return console.log("No item found.");
        }

        let fields = `${feature.uniqueField}`;
        if (feature.sortingField) {
            fields += ',' + feature.sortingField;
        }

        // Get the list of features
        featuresTables.getFeatures(
            feature.layerId,
            feature.expressionFilter,
            feature.withGeometry,
            fields,
            feature.fields
        ).then((response) => {
            popupObject = {
                layerId: feature.layerId,
                listFeature: response.data,
                uniqueField: feature.uniqueField,
                geometry: null,
            };
            indexListFeature = 0;

            for (let data of response.data) {
                let comparator;

                // Check if the feature has a geometry
                if (feature.withGeometry) {
                    const geometryType = data.geometry.type;
                    const coordinates = data.geometry.coordinates;
                    try {
                        // Create a geometry object and check if the feature is in the click
                        comparator = new lizMap.ol.geom[geometryType](coordinates);
                        comparator = comparator.intersectsCoordinate(event.coordinate)
                    } catch (e) {
                        console.error(e);
                    }
                } else {
                    // TODO: NON FOCTIONNEL
                }

                // If the feature is found, store it and break the loop
                if (comparator) {
                    popupObject.element = data;
                    break;
                }
                indexListFeature ++;
            }

            // If no feature is found, display an error message
            openPopup(popupObject);

        }).catch((error) => {
            console.error(error);
            featuresTables.addMessage("Error while getting the item.", 'error', 3000);
        });
    }
}

/**
 * Open the popup with the feature information
 * @param {object} popupObject - Popup object containing feature information
 */
function openPopup(popupObject) {
    //TODO: Function used for debug
    debugColor();

    if (popupObject.element.geometry) {
        const geometryType = popupObject.element.geometry.type;
        const coordinates = popupObject.element.geometry.coordinates;
        lizMap.mainLizmap.map.getView().fit(new lizMap.ol.geom[geometryType](coordinates), {duration: 300});
    }

    featuresTables.openPopup(
        popupObject.layerId,
        popupObject.element,
        popupObject.uniqueField,
        document.getElementById("lizmap-" + DOCK_ID),
        function(aLayerId, aFeature, aTarget) {
            buildHtml(true);
        }
    );
}

/**
 * Callback function called when the dock is opened
 * @param {string} clickDockId - ID of the dock
 */
function onDockOpened(clickDockId)
{
    if (clickDockId === DOCK_ID) {
        // external link dock closed : disable popup behaviour
        lizMap.mainLizmap.popup.active = false;
        document.getElementById(DOCK_ID).classList.add('active');
    }
}

/**
 * Callback function called when the dock is closed
 * @param {string} clickDock - ID or Class under the click event
 */
function onDockClosed(clickDock)
{
    if (clickDock === DOCK_ID || clickDock === 'mini-dock-close') {
        // external link dock closed : enable popup behaviour
        lizMap.mainLizmap.popup.active = true;
        document.getElementById(DOCK_ID).classList.remove('active');
    }
}

// Listen to Lizmap Web Client interface creation
lizMap.events.on({
    uicreated: function () {

        // Create the dock
        addLinkDock();

        // Register a click on OpenLayers > 2 map
        lizMap.mainLizmap.map.on('singleclick', onMapClick);

        document.getElementById(DOCK_ID).classList.add('hide');

        document.querySelector('.mini-dock-close').addEventListener('click', (e) => {
            onDockClosed(e.currentTarget.className);
            document.getElementById(DOCK_ID).classList.add('hide');
            document.querySelector(".item-features-view.nav-minidock").classList.remove('active');
        });

        featuresTables = new FeaturesTable(lizMap.mainLizmap.initialConfig, lizMap.mainLizmap.lizmap3);
    },
    minidockopened: function(e) {
        onDockOpened(e.id);
    },
    minidockclosed: function(e) {
        onDockClosed(e.id);
    }
});
