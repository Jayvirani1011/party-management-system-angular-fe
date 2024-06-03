import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Observable, Subscription, map, shareReplay, tap } from "rxjs";
import { PartyService } from "../party.service";
import { MatDialog } from "@angular/material/dialog";
import { IPartyRes } from "..";
import { MatTableDataSource } from "@angular/material/table";
import { DeviceService } from "../../shared/services/device.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import Swal from "sweetalert2";

@Component({
  selector: "app-party-list",
  templateUrl: "./party-list.component.html",
  styleUrl: "./party-list.component.scss",
})
export class PartyListComponent {
  subscription: Subscription = new Subscription();
  columnsName: string[] = [
    "actions",
    "name",
    "companyName",
    "mobileNo",
    "email",
  ];
  @Input({ required: true }) parties!: MatTableDataSource<IPartyRes>;

  isMobile: boolean = false;
  @Output() refresh: EventEmitter<void> = new EventEmitter<void>();
  @Output() edit: EventEmitter<IPartyRes["id"]> = new EventEmitter<
    IPartyRes["id"]
  >();

  constructor(
    private partyService: PartyService,
    private deviceService: DeviceService,
    private snackbar: MatSnackBar
  ) {
    const sub = this.deviceService.isMobile$
      .pipe(
        tap((res) => {
          this.isMobile = res;
        })
      )
      .subscribe();

    this.subscription.add(sub);
  }

  editParty(id: IPartyRes["id"]) {
    this.edit.emit(id);
  }
  deleteParty(id: IPartyRes["id"]) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        this.partyService
          .delete$(id)
          .pipe(
            tap(() => {
              this.refresh.emit();
              this.snackbar.open("Party deleted successfully", "", {
                duration: 2000,
              });
            })
          )
          .subscribe();
      }
    });
  }
}
