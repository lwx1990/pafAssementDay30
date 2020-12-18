import { HttpClient } from "@angular/common/http";
import {Injectable} from "@angular/core";
import { LoginDetails } from "./models";


@Injectable()
export class AuthenticationService {
    loginArray
    constructor(private http: HttpClient){}

    async checkLogin(login: LoginDetails){
         let result = await this.http.post('/login', login, {observe:'response'}).toPromise()
         this.loginArray = result.body
         return result
    }

}