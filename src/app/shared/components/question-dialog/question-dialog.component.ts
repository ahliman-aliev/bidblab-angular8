import { Component, OnDestroy, Inject, OnInit, Optional, AfterViewInit, AfterContentInit, ViewChildren } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, Validators,  FormControl  } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FormValidationService } from '../../services/form-validation.service';
import { BlockUIService } from '../../services/block-ui.service';
import {
  MatSnackBar,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatChipInputEvent,
} from '@angular/material';
import { CommonService } from '../../services/common.service';
import { Question } from '../../models/question.model';
import { SocketsService } from '../../services/sockets.service';
import { AuthenticationService } from '../../../shared/services/authentication.service';
import { User } from '../../../shared/models/user.model';
import { UserService } from '../../../shared/services/user.service';
@Component({
  selector: 'app-question-dialog',
  templateUrl: './question-dialog.component.html',
  styleUrls: ['./question-dialog.component.scss']
})
export class QuestionDialogComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit {

  @ViewChildren('input') vc;
  user: User;
  submitted: boolean;
  infoForm: FormGroup;
  private userUpdatesSubscription: Subscription;
  standardInterests: string[];
  uploadFiles: any[] = [];
  defaultCredits: any;
  init: boolean = false;
  selectedFileIndex: number = -1;

  constructor(
    private fb: FormBuilder,
    private formValidationService: FormValidationService,
    private blockUIService: BlockUIService,
    public commonService: CommonService,
    private socketsService: SocketsService,
    private authenticationService: AuthenticationService,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private dialogRef: MatDialogRef<QuestionDialogComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}


  ngAfterViewInit(){
    //this.vc.first.nativeElement.focus();
  }

  ngAfterContentInit(){
    this.init = true;
  }

  ngOnInit() {
    this.getUserUpdates();

    this.submitted = false;
    this.infoForm = this.fb.group({
      title: [
        this.data.question ? this.data.question.title : (this.data.newTitle? this.data.newTitle : ''),
        [
          Validators.required,
          Validators.maxLength(500),
          this.formValidationService.isBlank
        ]
      ],
      tag: [
        '',
        [
          Validators.required,
          this.formValidationService.isBlank
        ]
      ]
    });


    this.commonService.getStandardInterests().subscribe(
      (res: any) => {
        this.standardInterests = res.data;
      },
      (err: HttpErrorResponse) => {
      }
    );

    this.commonService.getDefaultCredits().subscribe(
			(res: any) => {
					this.defaultCredits = res.data;
				},
			(err: HttpErrorResponse) => {
				}
			);
    
  }

  ngOnDestroy() {
    this.userUpdatesSubscription.unsubscribe();
  }

  checkError(form, field, error) {
    return this.formValidationService.checkError(form, field, error);
  }
 
  private getUserUpdates() {
    this.userUpdatesSubscription = this.authenticationService
      .getUserUpdates()
      .subscribe(user => (
        this.user = user
      ));
  }


  submitForm() {
    if (this.infoForm.valid) {
      let uploadData = new FormData();
      this.uploadFiles.forEach(element => {
        if(element.croppedFile){
          uploadData.append('file', element.croppedFile, element.croppedFile.name);
        }
      });

      uploadData.append('title', this.infoForm.value.title);
      uploadData.append('tag', this.infoForm.value.tag);
      this.blockUIService.setBlockStatus(true);
      this.commonService.addQuestion(uploadData).subscribe(
        (res: any) => {
          this.socketsService.notify('createdData', {
            type: 'question',
            data: res.data
          });
          this.blockUIService.setBlockStatus(false);
          this.snackBar.open(res.msg, 'Dismiss', {
            duration: 1500
          })
          .afterOpened()
          .subscribe(() => {
            this.submitted = true;
            this.dialogRef.close(res.data);
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
            .subscribe(() => {
            });
        }
      );
    }
  }

  addPicture(data) {
    if (data) {
      this.uploadFiles[this.selectedFileIndex] = {
        originalFile: data.originalFile,
        croppedFile: data.croppedFile? data.croppedFile : this.uploadFiles[this.selectedFileIndex].croppedFile,
        croppedImage: data.croppedImage? data.croppedImage : this.uploadFiles[this.selectedFileIndex].croppedImage
      };
    }
    else{
      this.uploadFiles.splice(this.selectedFileIndex, 1);
    }
    this.selectedFileIndex = -1;
  }

  openCrop(index){
    if(this.selectedFileIndex != -1 && this.uploadFiles[this.selectedFileIndex].croppedFile == ''){
      this.uploadFiles.splice(this.selectedFileIndex, 1);
    }
    this.selectedFileIndex = index;
  }

  addFile(event: any): void {
    if (event.target.files && event.target.files[0]) {
      this.uploadFiles.push({
        originalFile: event.target.files[0],
        croppedFile: '',
        croppedImage: ''
      });
      this.selectedFileIndex = this.uploadFiles.length - 1;
    }
  }

}
