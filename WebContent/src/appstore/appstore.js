require('bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.min.css');
import '../scripts/fileupload/js/fileinput.min';
import 'jquery';
import 'bootstrap';
import 'jquery-ui';
import 'jquery-confirm';
import 'bootstrap-switch';
import Sortable from 'sortablejs/modular/sortable.core.esm.js';
import { marked } from 'marked';


class AppStore {
	constructor() {
		this.setupFileUpload();
		this.getApps();
		this.setupSortableLists();
		
		$("#installExtension").on('click',  ( )=> window.location="InstallExtension");

	}

	setupSortableLists() {
		let _this = this;
		let config = {
			animation: 100,
			group: 'assessment',
			draggable: '.list-group-item',
			handle: '.list-group-item',
			filter: '.sortable-disabled',
			ghostClass: 'active',
			onChoose: function(event) {
				$(".list-group-item").removeClass("active");
				$(event.item).addClass("active");
				let id = $(event.item).data("id");
				fetch(`GetDetails?id=${id}`)
				.then( response => response.json())
				.then( json => {
					$('#appBox').removeClass("disabled");
					$('#appDescription').html(marked.parse(_this.b64DecodeUnicode(json.description)));
					$('#appTitle').html(`${json.title} <br\><small>Version: ${json.version}</small>`);
					$('#appAuthor').html(json.author);
					$('#appURL').html(json.url);
					$('#appURL').attr("href", json.url);
					let logo = json.logo;
					if(logo==""){
						logo="../app-default.png";
					}else{
						logo=`data:image/png;base64, ${logo}`;
					}
					$('#appLogo').attr("src", logo);
				})
			},
			onEnd: function (evt) {
				const itemEl = evt.item;
				const appType = $(itemEl).parent()[0].id.replace("Extensions", "");
				
				const children = $(itemEl).parent().children();
				let index=0;
				const appIds = Array.from(children).map( c => c.dataset.id);
				const appList = `appList=${appIds.join(",")}&appType=${appType}`;
				fetch("ChangeOrder", {
					method: "POST", 
					mode: "cors", 
					cache: "no-cache", 
					credentials: "same-origin", 
					headers: {
					  'Content-Type': 'application/x-www-form-urlencoded',
					},
					redirect: "follow", 
					referrerPolicy: "no-referrer", 
					body: appList, 
				
				}).then( response => response.json())
				.then( json => console.log(json));
			}
		};
		Sortable.create($("#assessmentExtensions")[0], config);
		config.group = 'vulnerability';
		Sortable.create($("#vulnerabilityExtensions")[0], config);
		config.group = 'verification';
		Sortable.create($("#verificationExtensions")[0], config);
		config.group = 'inventory';
		Sortable.create($("#inventoryExtensions")[0], config);
		config.group = 'disabled';
		config.onEnd = function(){};
		Sortable.create($("#disabledExtensions")[0], config);
	}
	b64DecodeUnicode(str) {
		str=decodeURIComponent(str);
		return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
	} 

	setupFileUpload() {
		$("#appFile").fileinput({
			overwriteInitial: false,
			uploadUrl: "PreviewApp",
			uploadAsync: true,
			maxFileCount: 1,
			allowedFileExtensions: ['jar'],
			previewFileExtSettings: {
				'jar': function(ext) {
					return ext.match(/(jar)$/i);
				}
			},
			preferIconicPreview: true,
			previewFileIconSettings: {
				'jar': '<i class="fa fa-file-archive-o text-primary"></i>',
			},
		}).on("filebatchselected", function(event, files) {
			$("#appFile").fileinput("upload");
		});
	}

	createCard(id, name, version, author, url, logo, enabled) {
		if(logo==""){
			logo="../app-default.png";
		}else{
			logo=`data:image/png;base64, ${logo}`
		}
		let checked = "";
		if(enabled){
			checked = "checked"
		}
		const li = document.createElement("li");
		li.className = "list-group-item";
		li.setAttribute("data-id", id);
		li.innerHTML = `
				<div class="appCard row">
					<div class="col-md-1 handle-container" style="min-width: 100px">
						<div class="handle">
							<i class="fa-solid fa-grip-lines handle"></i>
					 		<img class="appLogo-small" src="${logo}"/>
						</div>
					</div>
					<div class="col-md-8 handle-container">
						<div class="handle">
							<b>${name}</b> Version: ${version}<br> by: ${author} <br> link:
							<a href="${url}">${url}</a>
						</div>
					</div>
					<div class="col-md-2 handle-container pull-right" style="width:120px">
						<div class="handle">
							<input type="checkbox" data-id="${id}" ${checked}/>
							&nbsp;&nbsp;<i class="fa fa-trash"></i>
						</div>
					</div>
				</div>`
		return li;
	}
	addCard(elId, id, name, version, author, url, logo, enabled) {
		$(elId).append(this.createCard(id, name, version, author, url, logo, enabled));
	}
	
	getApps(){
		fetch("GetApps")
		.then( (response) => response.json())
		.then( (json) => {
			this.updateLists("#disabledExtensions", json.disabled);
			this.updateLists("#assessmentExtensions", json.assessment);
			this.updateLists("#vulnerabilityExtensions", json.vulnerability);
			this.updateLists("#verificationExtensions", json.verification);
			this.updateLists("#inventoryExtensions", json.inventory);
			$('input[type="checkbox"]').bootstrapSwitch("size", "mini");
			$('input:checked').bootstrapSwitch("state", true, true);
			$('input[type="checkbox"]').on('switchChange.bootstrapSwitch', function(event, state) {
			  console.log(this); // DOM element
			  console.log(state); // true | false
			  const id = $(this).data("id");
			  if(state){
			  	fetch(`EnableApp?id=${id}`)
			  	.then( response => response.json())
			  	.then( json => location.reload())
			  }
			  else{
			  	fetch(`DisableApp?id=${id}`)
			  	.then( response => response.json())
			  	.then( json => location.reload())
			  }
			});
		})
	}
	updateLists(elId,list){
		if(list.length == 0){
			const li = document.createElement("li");
			li.className = "list-group-item";
			li.innerHTML = "No Extensions"
			$(elId).append(li);
			
		}else{
			list.forEach( data =>{
				this.addCard(elId, data.id, data.title, data.version, data.author, data.url, data.logo, data.enabled)	
			});
		}
	}

}

new AppStore();
