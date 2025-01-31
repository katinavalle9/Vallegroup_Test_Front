import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = 'http://localhost:8000/api/products'; // API de Lumen

  constructor(private http: HttpClient) {}

  getProducts(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'id',
    orderDir: string = 'asc',
    search: string = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('orderBy', orderBy)
      .set('orderDir', orderDir)
      .set('search', search);

    return this.http.get<any>(this.apiUrl, { params });
  }

  createProduct(product: any): Observable<any> {
    const body = new URLSearchParams();
    body.set('name', product.name);
    body.set('description', product.description);
    body.set('price', product.price);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded', // ✅ Esto evita el preflight OPTIONS
    });

    return this.http.post(this.apiUrl, body.toString(), { headers });
  }

  updateProduct(id: number, product: any): Observable<any> {
    const body = new URLSearchParams();
    body.set('name', product.name);
    body.set('description', product.description);
    body.set('price', product.price);
    body.set('_method', 'PUT'); // ✅ Engañamos al navegador para evitar OPTIONS

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded', // ✅ Igual que en POST para evitar OPTIONS
    });

    return this.http.post(`${this.apiUrl}/${id}`, body.toString(), { headers }); // ✅ Se envía como POST
  }

  deleteProduct(id: number): Observable<any> {
    const body = new URLSearchParams();
    body.set('_method', 'DELETE'); // ✅ Usamos POST con _method=DELETE para evitar OPTIONS

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http.post(`${this.apiUrl}/${id}`, body.toString(), { headers }); // ✅ Se envía como POST
  }
}
