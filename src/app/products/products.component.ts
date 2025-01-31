import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ProductService } from '../services/product.service';
import { DataTablesModule, DataTableDirective } from 'angular-datatables';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import 'datatables.net';

declare var bootstrap: any;

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [CommonModule, DataTablesModule, ReactiveFormsModule],
})
export class ProductsComponent implements OnInit, AfterViewInit {
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject<any>();
  productForm: FormGroup;
  private modalInstance: any = null;
  @ViewChild(DataTableDirective, { static: false })
  dtElement!: DataTableDirective;
  selectedProductId: number | null = null;
  @ViewChild('productModal') productModal!: ElementRef;

  constructor(private fb: FormBuilder, private productService: ProductService) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: ['', [Validators.required]],
    });
  }
  ngOnInit(): void {
    this.modalInstance = new bootstrap.Modal(
      document.getElementById('productModal')!
    );
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      serverSide: true,

      language: {
        search: 'Buscar:',
        lengthMenu: 'Mostrar _MENU_ registros por página',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
        paginate: {
          first: 'Primero',
          last: 'Último',
          next: 'Siguiente',
          previous: 'Anterior',
        },
      },
      ajax: (dataTablesParameters: any, callback: (data: any) => void) => {
        const page =
          dataTablesParameters.start / dataTablesParameters.length + 1;
        const limit = dataTablesParameters.length;
        const orderBy =
          dataTablesParameters.order.length > 0
            ? dataTablesParameters.columns[dataTablesParameters.order[0].column]
                .data
            : '';
        const orderDir =
          dataTablesParameters.order.length > 0
            ? dataTablesParameters.order[0].dir
            : '';
        const search = dataTablesParameters.search.value;

        this.productService
          .getProducts(page, limit, orderBy, orderDir, search)
          .subscribe((resp) => {
            callback({
              recordsTotal: resp.total,
              recordsFiltered: resp.total,
              data: resp.data,
            });
          });
      },
      columns: [
        { data: 'id', title: 'Id' },
        { data: 'name', title: 'Nombre' },
        { data: 'description', title: 'Descripción' },
        { data: 'price', title: 'Precio' },
        {
          data: null,
          title: 'Acciones',
          orderable: false,
          searchable: false,
          render: (data: any, type: any, row: any) => {
            return `
              <button class="btn btn-warning btn-sm edit-btn" data-id="${row.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-danger btn-sm delete-btn ms-2" data-id="${row.id}">
                <i class="fas fa-trash"></i>
              </button>
            `;
          },
        },
      ],
      rowCallback: (row: Node, data: any, index: number) => {
        $('button.edit-btn', row).on('click', () => {
          this.editProduct(data);
        });

        $('button.delete-btn', row).on('click', () => {
          this.deleteProduct(data.id);
        });
      },
    };
  }

  openModal(): void {
    this.productForm.reset();
    this.selectedProductId = null;
    if (this.modalInstance) {
      this.modalInstance.show(); // ✅ Abre el modal
    }
  }
  ngAfterViewInit(): void {
    this.dtTrigger.next(null);
    this.modalInstance = new bootstrap.Modal(this.productModal.nativeElement);
  }

  addOrEditProduct(): void {
    if (this.productForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa los campos obligatorios.',
      });
      return;
    }

    // Obtener los valores del formulario
    const product = this.productForm.value;
    if (this.selectedProductId) {
      this.productService
        .updateProduct(this.selectedProductId, product)
        .subscribe(
          () => {
            Swal.fire({
              icon: 'success',
              title: '¡Producto actualizado!',
              text: 'El producto se ha actualizado correctamente.',
              timer: 2000,
              showConfirmButton: false,
            });

            this.selectedProductId = null; // ✅ Reiniciar ID después de editar
            this.productForm.reset(); // ✅ Limpiar formulario después de guardar
            this.modalInstance.hide(); // ✅ Cerrar el modal
            this.dtElement.dtInstance.then((dtInstance: any) => {
              dtInstance.ajax.reload(null, false);
            });
          },
          (error) => {
            console.error('Error al actualizar producto:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un problema al actualizar el producto.',
            });
          }
        );
    } else {
      this.productService.createProduct(product).subscribe(
        () => {
          Swal.fire({
            icon: 'success',
            title: '¡Producto agregado!',
            text: 'El producto se ha guardado correctamente.',
            timer: 2000, // ✅ Cierra automáticamente en 2 segundos
            showConfirmButton: false,
          });
          this.productForm.reset(); // ✅ Limpiar formulario después de guardar
          this.modalInstance.hide(); // ✅ Cerrar el modal

          if (this.dtElement?.dtInstance) {
            this.dtElement.dtInstance.then((dtInstance: any) => {
              dtInstance.ajax.reload(null, false);
            });
          }
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un problema al guardar el producto.',
          });
        }
      );
    }
  }

  editProduct(product: any): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
    });
    this.selectedProductId = product.id;
    this.modalInstance.show();
  }

  deleteProduct(productId: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡Esta acción no se puede deshacer!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // ✅ Si el usuario confirma, se ejecuta la eliminación
        this.productService.deleteProduct(productId).subscribe(
          () => {
            Swal.fire({
              icon: 'success',
              title: '¡Producto eliminado!',
              text: 'El producto ha sido eliminado correctamente.',
              timer: 2000,
              showConfirmButton: false,
            });

            // ✅ Recargar DataTable después de eliminar
            this.dtElement.dtInstance.then((dtInstance: any) => {
              dtInstance.ajax.reload(null, false);
            });
          },
          (error) => {
            console.error('Error al eliminar producto:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un problema al eliminar el producto.',
            });
          }
        );
      }
    });
  }
}
