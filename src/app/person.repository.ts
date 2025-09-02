import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PersonRepository {
  private baseUrl = 'http://localhost:5260/api/Person';

  constructor(private http: HttpClient) {}

  getPersonList(): Observable<any> {
    const url = `${this.baseUrl}/list`;
    return this.http.get(url).pipe(
      catchError((error) => {
        console.error('Error fetching person list:', error);
        return of(null);
      })
    );
  }

  getPerson(): Observable<any> {
    const url = this.baseUrl;
    return this.http.get(url).pipe(
      catchError((error) => {
        console.error('Error fetching person:', error);
        return of(null);
      })
    );
  }
}
