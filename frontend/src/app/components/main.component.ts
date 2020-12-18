import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import {CameraService} from '../camera.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
	@ViewChild('imageFile') imageFile: ElementRef;

	imagePath = '/assets/cactus.png'

	mainForm : FormGroup

	image: any

	constructor(private cameraSvc: CameraService, private fb: FormBuilder, private http: HttpClient, 
		private loginSvc: AuthenticationService, private router: Router) { }

	ngOnInit(): void {
		this.mainForm = this.fb.group({
        	title: this.fb.control('', [Validators.required]),
			comments: this.fb.control('', [Validators.required]),
			'image-file': this.fb.control('',[Validators.required])
		})
		
	  if (this.cameraSvc.hasImage()) {
		  const img = this.cameraSvc.getImage()
		  this.imagePath = img.imageAsDataUrl
		  this.mainForm.get('image-file').patchValue(this.cameraSvc.getImage())
	  }

	}

	
	share(){
		const formData = new FormData();
		console.log(this.mainForm.value)
        formData.set('title', this.mainForm.get('title').value);
		formData.set('comments', this.mainForm.get('comments').value);
		formData.set('name', 'imageFile');
		formData.set('imageFile', this.cameraSvc.getImage().imageData);
		formData.set('username', this.loginSvc.loginInfo.username);
		formData.set('password', this.loginSvc.loginInfo.password);
        this.http.post('/share', formData, {observe:'response'})
          .toPromise()
          .then((result)=>{ 
				console.log(result)
			  if(result.status == 200) {
					this.mainForm.reset()
					this.clear()
			  } else {
				alert()
				this.router.navigate(['/'])
			  }
			
          }).catch((error)=>{
            console.log(error);
		  });		  

	}

	clear() {
		this.imagePath = '/assets/cactus.png'
	}


}
