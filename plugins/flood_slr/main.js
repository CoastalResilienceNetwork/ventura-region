define([
        "dojo/_base/declare",
		"framework/PluginBase",
		
		"esri/request",
		"esri/layers/ArcGISDynamicMapServiceLayer",
		"esri/layers/ArcGISImageServiceLayer",
		"esri/layers/ImageServiceParameters",
		"esri/layers/RasterFunction",
		"esri/tasks/ImageServiceIdentifyTask",
		"esri/tasks/ImageServiceIdentifyParameters",
		"esri/tasks/QueryTask",
		"esri/tasks/query",
		"esri/graphicsUtils",
		
		"esri/symbols/SimpleLineSymbol",
		"esri/symbols/SimpleFillSymbol",
		"esri/symbols/SimpleMarkerSymbol",
		
		"dijit/registry",
		"dijit/form/Button",
		"dijit/form/DropDownButton",
		"dijit/DropDownMenu", 
		"dijit/MenuItem",
		"dijit/layout/ContentPane",
		"dijit/form/HorizontalSlider",
		"dijit/form/CheckBox",
		"dijit/form/RadioButton",
		"dojo/dom",
		"dojo/dom-class",
		"dojo/dom-style",
		"dojo/_base/window",
		"dojo/dom-construct",
		"dojo/dom-attr",
		"dijit/Dialog",
		"dojo/dom-geometry",
		
		"dojo/_base/array",
		"dojo/_base/lang",
		"dojo/on",
		"dojo/parser",
		"dojo/query",
		"dojo/NodeList-traverse",
        
		"dojo/text!./layerviz.json"
		//plugins/restoration_explorer/
		
       ],
       function (declare, 
					PluginBase, 
					ESRIRequest,
					ArcGISDynamicMapServiceLayer,
					ArcGISImageServiceLayer,
					ImageServiceParameters,
					RasterFunction,
					ImageServiceIdentifyTask,
					ImageServiceIdentifyParameters,
					QueryTask,
					esriQuery,
					graphicsUtils,
					SimpleLineSymbol,
					SimpleFillSymbol,
					SimpleMarkerSymbol,
					registry,
					Button,
					DropDownButton, 
					DropDownMenu, 
					MenuItem,
					ContentPane,
					HorizontalSlider,
					CheckBox,
					RadioButton,
					dom,
					domClass,
					domStyle,
					win,
					domConstruct,
					domAttr,
					Dialog,
					domGeom,
					array,
					lang,
					on,
					parser,
					dojoquery,
					NodeListtraverse,
					layerViz
					) {
					
           return declare(PluginBase, {
		       toolbarName: "Flood & Sea Level Rise",
               toolbarType: "sidebar",
			   showServiceLayersInLegend: true,
               allowIdentifyWhenActive: true,
			   infoGraphic: "plugins/flood_slr/slr_flooding_c.jpg",
			   height: 570,
			   rendered: false,
			   
               activate: function () { 
			   
					if (this.rendered == false) {
					
						this.rendered = true;
					
						this.render();
						
						this.currentLayer.setVisibility(true);
					
					
					} else {
			  
						if (this.currentLayer != undefined)  {
						
							this.currentLayer.setVisibility(true);
						
						}
						

					}
					
			  
			   },
               deactivate: function () { },
               hibernate: function () { 
			   
					if (this.currentLayer != undefined)  {
					
						this.currentLayer.setVisibility(false);
					
					}
					
			   
			   },
			   
			   
				initialize: function (frameworkParameters) {
				
					declare.safeMixin(this, frameworkParameters);

					domClass.add(this.container, "claro");
					
					this.layerVizObject = dojo.eval("[" + layerViz + "]")[0];
					
					this.controls = this.layerVizObject.controls;

					this.groupindex = [];
					
					array.forEach(this.controls, lang.hitch(this,function(control, i){

						if (control.type == "group") {this.groupindex.push(i)};
					
					}));
				
					console.log(this.controls);
					
					layersRequest = ESRIRequest({
							  url: this.layerVizObject.url,
							  content: { f: "json" },
							  handleAs: "json",
							  callbackParamName: "callback"
							});
							
					layersRequest.then(
							  lang.hitch(this,this.setup), function(error) {
								console.log("Error: ", error.message);
							});
					
				},
				
				
				 resize: function(w, h) {
				 
					cdg = domGeom.position(this.container);
					console.log(this.sliderpane.domNode);
					
					
					
					
					if (cdg.h == 0) {
						
						this.sph = this.height - 120 
						
					} else {
					
						this.sph = cdg.h-82;
					
					}
					
					domStyle.set(this.sliderpane.domNode, "height", this.sph + "px");
					

					
					//alert(cdg.h);
				 
				 },
			   

			   setup : function(response) {
					
					console.log("Success: ", response);

					this.layerlist = {};
					
					array.forEach(response.layers, lang.hitch(this,function(layer, i){
					
						layerSplit = layer.name.split("__")
						//console.log(layerSplit)
						//console.log(layerSplit.length);
						
						this.layerlist[layer.name] = layer.id;
						
						array.forEach(layerSplit, lang.hitch(this,function(cat, i){
						
							cgi = this.groupindex[i]
							
							
							if (this.controls[cgi].options == undefined) {
							
								this.controls[cgi].options = [];
								makedefault = true;
							
							} else {
							
								makedefault = false;
							
							}
							
							withingroup = false;
							
						    array.forEach(this.controls[cgi].options, lang.hitch(this,function(opts, i){
								
								if (opts.value == cat) {
								
									withingroup = true;
								
								}
							
							}));
							
							if (withingroup == false) {
							
								newoption = {};
								newoption.text = cat;
								newoption.selected = makedefault;
								newoption.value = cat;
							
								this.controls[cgi].options.push(newoption)
							
							}
							
						
						}));
						
					}));
					
				
					//console.log(this.controls);
					
							
				},
			
			   updateMap: function() {
			   					
					outvalues = [];
					
					array.forEach(this.controls, lang.hitch(this,function(entry, orderid){
					
						if (entry.type == "group") {
					
						array.forEach(entry.options, lang.hitch(this,function(option, i){
			   
							if (option.selected == true) {
							
								//need to put code to build here
								
								if (option.enabled) {outvalues.push(option.value)};
							
							}
			   
						}));
						
						}
						
					}));
				
					
					
					layertoAdd = this.layerlist[outvalues.join("__")];
					
					x = 0;
					while  (layertoAdd == undefined) {
					
						outvalues = outvalues.slice(0,outvalues.length -1)
						layertoAdd = this.layerlist[outvalues.join("__")];
						
						x = x + 1
						if (x > 9999) {
							layertoAdd = "None"
						}

					
					}

					console.log(layertoAdd);
					
					slayers = [];
					slayers.push(layertoAdd);
					
					//this.currentLayer.setVisibility(true);
					this.currentLayer.setVisibleLayers(slayers);
					
					this.resize();
					
				},
				

				
				updateUnique: function(val,group) {
				
				console.log(val);
			   
					array.forEach(this.controls[group].options, lang.hitch(this,function(option, i){
			   
						option.selected = false;
			   
					}));
					
					
					this.controls[group].options[val].selected = true;
					//console.log(this.controls);
					
					this.findInvalids();
					
					this.updateMap();
					
					
				},
				
				
				findInvalids: function() {
				
				
					clist = [];
				
					array.forEach(this.groupindex, lang.hitch(this,function(cat, cgi){
					
						ccontrol = this.controls[cat]
						
						okvals = [];
						
						needtoChange = false;
						
						array.forEach(ccontrol.options, lang.hitch(this,function(option, i){
			   
							if (option.selected == true) {
							
								clist.push(option.value)
							
							}
							

							tlist = clist.slice(0,cgi);
							tlist.push(option.value);
							
							checker = tlist.join("__");
							
							enabled = false
							
							for (key in this.layerlist) {
							
								n = key.indexOf(checker);
							
								if (n==0) {
								
									enabled = true;
								
								}
							
							}
							
							option.enabled = enabled;
							
							cdom = dom.byId(this.sliderpane.id + "_lvoption_" + cat + "_" + i)
							
							if (enabled) {
								domStyle.set(cdom,"color","#000")
								okvals.push(i);
							} else {
								domStyle.set(cdom,"color","#bbb")
							}
			   
							if ((enabled == false) && (option.selected == true)) {
							
								needtoChange = true;
							
							} 
			   
						}));						
						
						if ((needtoChange == true) && (okvals.length > 0)) {
						
							if (ccontrol.control == "slider") {
							
								cwidget = registry.byId(this.sliderpane.id + "_slider_" + cat)
								cwidget.set('value',okvals[0]);
							
							} else {
							
								//cwidgets = registry.findWidgets(ccontrol.node)
							
								cwidget = registry.byId(this.sliderpane.id + "_radio_" + cat + "_" + okvals[0])
							
								cwidget.set('value',true);
							
							}
						
						//alert('changeit');
						
						}
					
						
							
					}));
				
					
				
				},
				
				zoomToActive: function() {
				
					this.map.setExtent(this.currentLayer.fullExtent, true);				
				
				},
				
				changeOpacity: function(e) {
					
					this.currentLayer.setOpacity(1 - e)
				
				},
				
				render: function() {
						
					a = dojoquery(this.container).parent();
					
					this.infoarea = new ContentPane({
					  style:"z-index:10000; !important;position:absolute !important;left:310px !important;top:0px !important;width:350px !important;background-color:#FFF !important;padding:10px !important;border-style:solid;border-width:4px;border-color:#444;border-radius:5px;display: none",
					  innerHTML: "<div class='infoareacloser' style='float:right !important'><a href='#'>✖</a></div><div class='infoareacontent' style='padding-top:15px'>no content yet</div>"
					});
					
					dom.byId(a[0]).appendChild(this.infoarea.domNode)
					
					ina = dojoquery(this.infoarea.domNode).children(".infoareacloser");
					this.infoAreaCloser = ina[0];

					inac = dojoquery(this.infoarea.domNode).children(".infoareacontent");
					this.infoareacontent = inac[0];
					//this.infoareacontent.innerHTML = "kdsflkjd fdfkjasd flkdjf sdflkdsjf sldkfjds lfksdjfldskfjsd lkfjsdflkds flsdkfjdslfk jsdlfkjsdfl ksjdfl ksdjflsdk jflsdkjfalsdkfjsldkfj asldkfj lsdkj flaskd jflaskd jflskdjfsldkfjasldkfjdslkf jdslfk jsdlkfjdslkfjdsal kjasdflkjsdlfkjsadlfkjsdlkfjasdkfjasldkfjsldkfjsldkjfdlkfjasl kdfj laksdjflaksd jflaksdjflaksdjf laksdjflkasjdflkajsdflkjasdfl kjsdlfkjasdlfkjasdlkfjasldkfj asdfkjasdlf kjasdflkjasdflk";
					
					on(this.infoAreaCloser, "click", lang.hitch(this,function(e){
						domStyle.set(this.infoarea.domNode, 'display', 'none');
					}));
					
					this.sliderpane = new ContentPane({
					  //style:"height:" + this.sph + "px !important"
					});
					
					parser.parse();
					
					dom.byId(this.container).appendChild(this.sliderpane.domNode);
					
					this.buttonpane = new ContentPane({
					  style:"border-top-style:groove !important; height:80px;overflow: hidden !important;background-color:#F3F3F3 !important;padding:10px !important;"
					});
					
					dom.byId(this.container).appendChild(this.buttonpane.domNode);	

					
					if (this.layerVizObject.methods != undefined) {
						methodsButton = new Button({
							label: "Methods",
							style:  "float:right !important;",
							onClick: lang.hitch(this,function(){window.open(this.layerVizObject.methods)})  //function(){window.open(this.layerVizObject.methods)}
							});	
						this.buttonpane.domNode.appendChild(methodsButton.domNode);
					}					
					
					
							nslidernodetitle = domConstruct.create("span", {innerHTML: " Layer Properties: "});
							this.buttonpane.domNode.appendChild(nslidernodetitle);
							
							zoombutton = domConstruct.create("a", {class: "pluginLayer-extent-zoom", href: "#", title: "Zoom to Extent"});
							this.buttonpane.domNode.appendChild(zoombutton);
							on(zoombutton, "click", lang.hitch(this, this.zoomToActive));
							
							nslidernode = domConstruct.create("div");
							this.buttonpane.domNode.appendChild(nslidernode); 
							
							labelsnode = domConstruct.create("ol", {"data-dojo-type":"dijit/form/HorizontalRuleLabels", container:"bottomDecoration", style:"height:0.25em;padding-top: 10px !important;color:black !important", innerHTML: "<li>Opaque</li><li>Transparent</li>"})
							nslidernode.appendChild(labelsnode);
							
							slider = new HorizontalSlider({
								value: 0,
								minimum: 0,
								maximum: 1,
								showButtons:false,
								title: "Change the layer transparency",
								//intermediateChanges: true,
								//discreteValues: entry.options.length,
								onChange: lang.hitch(this,this.changeOpacity),
								style: "width:210px;margin-top:10px;margin-bottom:20px;margin-left:20px; background-color:#F3F3F3 !important"
							}, nslidernode);
							
							parser.parse()
					
					
					array.forEach(this.controls, lang.hitch(this,function(entry, groupid){
						
						if (entry.type == "header") {

							nslidernodeheader = domConstruct.create("div", {style:"margin-top:0px;margin-bottom:10px", innerHTML: "<b>" + entry.text + ":</b>"});
							this.sliderpane.domNode.appendChild(nslidernodeheader);	
							
						} 
						
						if (entry.type == "text") {

							nslidernodeheader = domConstruct.create("div", {style:"margin-top:10px;margin-bottom:10px", innerHTML: entry.text});
							this.sliderpane.domNode.appendChild(nslidernodeheader);	
							
						} 
						
						
						if (entry.type == "group") {		
						
							if (entry.control == "slider") {
							
							  outslid = "";
								
							  array.forEach(entry.options, lang.hitch(this,function(option, i){
								
								if (option.help != undefined) {
									outslid = outslid + "<li><span id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'> <a style='color:black' href='#' title='" + option.help + "'>" + option.text.replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>") + "</a></span></li>";
								} else {
									outslid = outslid + "<li><span id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'> " + option.text.replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>").replace(" ","<br>") + "</span></li>";
								
								}
								if (option.selected == true) {
									defaultvalue = i;	
								}
								
								// id='" + this.toolbarName + "_" + groupid + "_" + i + "'
								
							  })); 
	
							nslidernodetitle = domConstruct.create("div", {innerHTML: entry.title});
							this.sliderpane.domNode.appendChild(nslidernodetitle);
							
							nslidernode = domConstruct.create("div");
							this.sliderpane.domNode.appendChild(nslidernode); 
							
							labelsnode = domConstruct.create("ol", {"data-dojo-type":"dijit/form/HorizontalRuleLabels", container:"bottomDecoration", style:"height:0.25em;padding-top: 10px !important;color:black !important", innerHTML: outslid})
							nslidernode.appendChild(labelsnode);
							
							slider = new HorizontalSlider({
								name: "group_" + groupid,
								id: this.sliderpane.id + "_slider_" + groupid,
								value: defaultvalue,
								minimum: 0,
								maximum: (entry.options.length -1),
								showButtons:false,
								title: entry.title,
								intermediateChanges: true,
								discreteValues: entry.options.length,
								index: groupid,
								onChange: lang.hitch(this,function(e) {this.updateUnique(e, groupid)}),
								style: "width:210px;margin-top:10px;margin-bottom:20px"
							}, nslidernode);
							
							parser.parse()
							
							//entry.node = slider.domNode;

	
							} else {
						
							
							   ncontrolsnode = domConstruct.create("div");
							   this.sliderpane.domNode.appendChild(ncontrolsnode);
							   
							   if (entry.title != undefined) {
									
									ncontrolsnodetitle = domConstruct.create("div", {innerHTML: entry.title});
									ncontrolsnode.appendChild(ncontrolsnodetitle);
								
							   }
								
							   array.forEach(entry.options, lang.hitch(this,function(option, i){
							   
							//	if (entry.control == "radio") {
									rorc = RadioButton;
							//	} else {
							//		rorc = CheckBox;
							//	}
							
								//alert(option.help)
								

								ncontrolnode = domConstruct.create("div");
								ncontrolsnode.appendChild(ncontrolnode); 
								parser.parse();
								
								   ncontrol = new rorc({
									name: "group_" + groupid,
									id: this.sliderpane.id + "_radio_" + groupid + "_" + i,
									value: option.value,
									index: groupid,
									title: option.text,
									checked: option.selected,
									onChange: lang.hitch(this,function(e) { if(e) {this.updateUnique(i, groupid)}})
									}, ncontrolnode);
									
									if (option.help != undefined) {
										nslidernodeheader = domConstruct.create("div", {style:"display:inline", innerHTML: "<span style='color:#000' id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'><a style='color:black' href='#' title='" + 'Click for more information.' + "'><img src='data:image/png;base64,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'></a> " + option.text + "</span><br>"});
									} else {
										nslidernodeheader = domConstruct.create("div", {style:"display:inline", innerHTML: "<span style='color:#000' id='" + this.sliderpane.id + "_lvoption_" + groupid + "_" + i + "'> " + option.text + "</span><br>"});									
									}
									
									on(nslidernodeheader, "click", lang.hitch(this,function(e){
										domStyle.set(this.infoarea.domNode, 'display', '');
										this.infoareacontent.innerHTML = option.help;
									}));
									
									ncontrolsnode.appendChild(nslidernodeheader);

								
									parser.parse()	
							  
							  })); 
							  
							  //entry.node = ncontrolsnode;
							  
							}
						
							
							nslidernodeheader = domConstruct.create("br");
							this.sliderpane.domNode.appendChild(nslidernodeheader);	

						
						}					
						
					
					}));
					
					this.currentLayer = new ArcGISDynamicMapServiceLayer(this.layerVizObject.url);
					
					
					
					this.map.addLayer(this.currentLayer);
					
					
					dojo.connect(this.currentLayer, "onLoad", lang.hitch(this,function(e){
					
											this.findInvalids();
					
											this.updateMap();
											
											//alert(this.currentLayer.name)
											
											}));


					this.resize();
				
				},

			   
	//		   identify: function(point, screenPoint, processResults) {
							

						
	//		   },
				
			   showHelp: function () {
			   
									helpDialog = new Dialog({
									
										title: "My Dialog",
										content: "Test content.",
										style: "width: 300px"
									
									});	

									helpDialog.show();
									
			   },
				
               getState: function () { 
			   
				console.log(this.controls);
			   
				state = this.controls;
			   
				return state;
	
			   
				},
				
				
               setState: function (state) { 
				
				this.controls = state;
				
				this.render();
				
				
				},
           });
       });
