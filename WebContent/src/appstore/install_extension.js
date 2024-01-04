require('bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.min.css');
import '../scripts/fileupload/js/fileinput.min';
import 'jquery';
import 'bootstrap';
import 'jquery-ui';
import 'jquery-confirm';
import 'bootstrap-switch';
import { marked } from 'marked';

class InstallExtension {
	constructor() {
		this.setupFileUpload();

	}

	setupFileUpload() {
		let _this = this;
		let fileUpload = $("#appFile").fileinput({
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
		}).on("fileuploaded", function(_event, data){
			if(data.response.error){
				console.log("Error thing");
			}else{
				_this.loadPluginPage(data.response.extension_info);
			}
			
		});
		$("#cancelInstall").on('click', ()=>{ 
			location.href="InstallExtension"
		});
		$("#backToAppStore").on('click', ()=>{ 
			location.href="AppStoreDashboard"
		});
		
		$("#installExtension").on('click', ()=>{
			fetch("InstallApp")
			.then( response => response.json())
			.then( json => {
				if(json.message == "success"){
					location.href = "AppStoreDashBoard"
				}else{
					$.alert({
						title: "Error",
						content: json.message
					})
				}
			})
		})
	}
	loadPluginPage(info){
		this.showPage();
		$("#appLogo").attr('src',`data:image/png;base64, ${info.logo}`);
		$("#appTitle").html(`${info.title} <br/><small>Version: ${info.version}</small>`) ;
		$('#appAuthor').html(info.author);
		$('#appURL').attr('href',info.url);
		$('#appURL').html(info.url);
		$('#appDescription').html(marked.parse(this.b64DecodeUnicode(info.description)));
		
	}
	showPage(){
		$("#appUpload").hide();
		$("#extensionPage").show();
	}
	b64DecodeUnicode(str) {
		str=decodeURIComponent(str);
		return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
	} 


}

new InstallExtension();