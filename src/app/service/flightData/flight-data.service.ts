import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of} from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class FlightDataService {

  constructor(private http: HttpClient) { }
  getAllFlightData():Observable<any>{
    return this.http.get<any>('https://tw-frontenders.firebaseio.com/advFlightSearch.json').pipe(
      tap((data) => console.log('listing all current openings')),
      catchError(this.handleError<any>('getAllJobOpenings'))
    );
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}
