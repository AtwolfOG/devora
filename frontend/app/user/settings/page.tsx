import Billing from "./billing";
import OAuth from "./oauth";
import UserDetails from "./userDetails";

export default function SettingsPage() {
    return (
        <div>
          <h3>Settings</h3>
          <p>Manage your account settings</p>
          <div>
           <UserDetails/>
           <OAuth google={true} github={false} password={true}/>
           <Billing />
          </div>
        </div>
    )
}