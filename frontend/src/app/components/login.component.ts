import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../authentication.service';
import { LoginDetails } from '../models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage = ''
  
  form: FormGroup;

  constructor(private fb: FormBuilder,private authSvc: AuthenticationService, private router: Router) { }

	ngOnInit(): void {
    this.form = this.fb.group({
        username: this.fb.control('', [Validators.required]),
        password: this.fb.control('', [Validators.required])
    })
  }

  login(){

    let logindetail : LoginDetails = {
      username: this.form.get('username').value,
      password: this.form.get('password').value,
    }

    this.authSvc.checkLogin(logindetail)
      .then(result=> {
        console.log(result)
          if (result.status == 200){
            this.router.navigate(['/main'])
          } 
      }).catch(e => {
        this.errorMessage = "wrong username or password"
        console.error('error:', e)
      })
        
  
    
  }
    
} 
