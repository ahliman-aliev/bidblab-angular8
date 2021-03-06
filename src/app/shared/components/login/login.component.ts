import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import * as jwtDecode from 'jwt-decode';
import { AuthenticationService } from '../../services/authentication.service';
import { FormValidationService } from '../../services/form-validation.service';
import { BlockUIService } from '../../services/block-ui.service';
import { MatSnackBar, MatDialogRef } from '@angular/material';
import { CommonService } from '../../services/common.service';
import { SignupDialogComponent } from '../signup-dialog/signup-dialog.component';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  submitted: boolean;
  passwordVisibility: boolean;
  loginForm: FormGroup;
  forgotForm: FormGroup;
  adminMode: boolean;
  forgotMode: boolean;

  constructor(
    private fb: FormBuilder,
    private formValidationService: FormValidationService,
    private authenticationService: AuthenticationService,
    private blockUIService: BlockUIService,
    public commonService: CommonService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<LoginComponent>
  ) {}

  ngOnInit() {
    this.forgotMode = false;
    this.passwordVisibility = false;
    this.submitted = false;
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, this.formValidationService.isBlank]],
      password: ['', Validators.required]
    });
    this.forgotForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          this.formValidationService.isBlank,
          Validators.email
        ]
      ]
    });
  }

  checkError(form, field, error) {
    return this.formValidationService.checkError(form, field, error);
  }

  togglePasswordVisibility(event) {
    if (!(event.type === 'mouseleave' && !this.passwordVisibility)) {
      this.passwordVisibility = !this.passwordVisibility;
    }
    return event.preventDefault();
  }

  private userLogin() {
    this.commonService.userLogin(this.loginForm.value).subscribe(
      (res: any) => {
        this.authenticationService.setToken(res.data);
        this.authenticationService.setUser(jwtDecode(res.data).user);
        localStorage.setItem('jwt', res.data);
        localStorage.setItem(
          'user',
          JSON.stringify(this.authenticationService.getUser())
        );
        this.blockUIService.setBlockStatus(false);
        this.snackBar
          .open(res.msg, 'Dismiss', {
            duration: 1000
          })
          .afterOpened()
          .subscribe(() => {
            this.dialogRef.close("OK");
          });
      },
      (err: HttpErrorResponse) => {
        this.submitted = false;
        this.blockUIService.setBlockStatus(false);
        this.snackBar
          .open(err.error.msg, 'Dismiss', {
            duration: 4000
          })
          .afterDismissed()
          .subscribe(() => {});
      }
    );
  }

  private forgotPassword() {
    this.commonService.forgotPassword(this.forgotForm.value).subscribe(
      (res: any) => {
        this.blockUIService.setBlockStatus(false);
        this.snackBar
          .open(res.msg, 'Dismiss')
          .afterOpened()
          .subscribe(() => {
            this.dialogRef.close();
          });
      },
      (err: HttpErrorResponse) => {
        this.submitted = false;
        this.blockUIService.setBlockStatus(false);
        this.snackBar
          .open(err.error.msg, 'Dismiss', {
            duration: 4000
          })
          .afterDismissed()
          .subscribe(() => {});
      }
    );
  }

  toggleForgotMode() {
    this.forgotMode = !this.forgotMode;
  }

  submitForm() {
    const form = this.forgotMode ? this.forgotForm : this.loginForm;
    if (form.valid) {
      this.submitted = true;
      this.blockUIService.setBlockStatus(true);
      if (this.forgotMode) {
        this.forgotPassword();
      } else {
        this.userLogin();
      }
    }
  }

  gotoSignup() {
    this.dialogService.open(SignupDialogComponent, {
      data: { }
    });
  }

}
