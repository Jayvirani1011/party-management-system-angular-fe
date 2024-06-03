import { Component, Inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import { PartyService, } from '../party.service';
import { DatePipe } from '@angular/common';
import { finalize, map, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { RemoveNullProperties, PathNormalize } from 'app/shared/utils/common.utils';
import { IPartyRes } from '../party';

@Component({
  selector: 'app-party-add-edit',
  templateUrl: './party-add-edit.component.html',
  styleUrl: './party-add-edit.component.scss',
})
export class PartyAddEditComponent implements OnInit {
  createPartyForm: FormGroup;
  update: boolean = false;

  constructor(
    private _fb: FormBuilder,
    private _partyService: PartyService,
    private _date: DatePipe,
    private _snackbar: MatSnackBar,
    private _refDialog: MatDialogRef<PartyAddEditComponent>,
    @Inject(MAT_DIALOG_DATA) public id: IPartyRes['id']
  ) {
    this.createPartyForm = this._fb.group({
      id: [''],
      name: ['', Validators.required],
      company_name: ['', Validators.required],
      mobile_no: ['', Validators.required],
      telephone_no: ['', Validators.required],
      whatsapp_no: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      login_access: [false],
      date_of_birth: ['', Validators.required],
      anniversary_date: ['', Validators.required],
      gstin: ['', Validators.required],
      pan_no: ['', Validators.required],
      apply_tds: [false],
      credit_limit: ['', Validators.required],
      remark: ['', [Validators.maxLength(500)]],
      address: this._fb.array([]),
      bank: this._fb.array([]),
    });

    if (this.id) {
      this.update = true;
    } else {
      this.addAddress();
      this.addBank();
    }
  }

  ngOnInit(): void {
    if (this.update) {
      this.initEditData(this.id);
    }
  }
  fileUrl: string = '';
  initEditData(id: IPartyRes['id']) {
    this._partyService
      .getOne$(id)
      .pipe(
        map(res => ({
          ...res,
          date_of_birth: new Date(res.date_of_birth),
          anniversary_date: new Date(res.anniversary_date),
          bank: res.bank_id,
        })),
        tap(res => {
          res.address.forEach(() => {
            this.addAddress();
          });
          res.bank.forEach(() => {
            this.addBank();
          });
          this.createPartyForm.patchValue(res);
          this.fileUrl = res.image || '';
        })
      )
      .subscribe();
  }

  get address(): FormArray {
    return this.createPartyForm.get('address') as FormArray;
  }

  get bank(): FormArray {
    return this.createPartyForm.get('bank') as FormArray;
  }

  addAddress() {
    this.address.push(
      this._fb.group({
        id: [undefined],
        address_line_1: ['', Validators.required],
        address_line_2: [''],
        country: ['', Validators.required],
        state: ['', Validators.required],
        city: ['', Validators.required],
        pincode: ['', Validators.required],
      })
    );
  }

  addBank() {
    this.bank.push(
      this._fb.group({
        id: [undefined],
        bank_ifsc_code: ['', Validators.required],
        bank_name: ['', Validators.required],
        branch_name: ['', Validators.required],
        account_no: ['', Validators.required],
        account_holder_name: ['', Validators.required],
      })
    );
  }

  remove(index: number, formControl: 'address' | 'bank') {
    this[formControl].removeAt(index);
  }

  selectedFile: File | null = null;
  uploadProgress: number | null = null;
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  submitting: boolean = false;
  onSubmit() {
    if (this.createPartyForm.valid) {
      const formData = this.makeFormData();

      // Append the file if it exists
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }

      this.submitting = true;
      this._partyService
        .add$(formData)
        .pipe(
          tap(res => {
            this._refDialog.close(true);
            this._snackbar.open(res.msg, '', {
              duration: 2000,
            });
          }),
          finalize(() => (this.submitting = false))
        )
        .subscribe();
    }
  }

  onUpdate() {
    if (this.createPartyForm.valid) {
      const formData = this.makeFormData();

      this.submitting = true;
      this._partyService
        .update$(this.id, formData)
        .pipe(
          tap(res => {
            this._refDialog.close(true);
            this._snackbar.open(res.msg, '', {
              duration: 2000,
            });
          }),
          finalize(() => (this.submitting = false))
        )
        .subscribe();
    }
  }

  private makeFormData() {
    const formData = new FormData();
    Object.keys(this.createPartyForm.controls).forEach((key: string) => {
      const control = this.createPartyForm.get(key);
      if (control) {
        if (key === 'address' || key === 'bank') {
          formData.append(
            key,
            JSON.stringify(RemoveNullProperties(control.value))
          );
        } else if (key === 'date_of_birth' || key === 'anniversary_date') {
          formData.append(
            key,
            this._date.transform(control.value, 'yyyy-MM-dd') || ''
          );
        } else {
          formData.append(key, control.value);
        }
      }
    });

    return formData;
  }

  viewFile() {
    window.open(PathNormalize(environment.API_URL + this.fileUrl), '_blank');
  }
}
