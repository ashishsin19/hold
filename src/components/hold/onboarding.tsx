export function Onboarding() {
  return (
    <div className="screen-scroll flex flex-col justify-between">
      <div className="stagger pt-8">
        <p className="m-0 text-xs font-medium tracking-[0.22em] text-subtle uppercase">
          iOS 27  ·  Presence OS
        </p>
        <h1 className="large-title mt-3">HOLD</h1>
        <p className="subhead max-w-sm">
          Every kit on iPhone feeds the Action Button. Software can propose.
          Only a press can commit.
        </p>
        <div className="ob-kits">
          {[
            ["WeatherKit", "Lock widget + heartbeat"],
            ["MapKit", "Geofence at this fix"],
            ["CoreLocation", "Signed coordinates"],
            ["Face ID", "Unlocks. Never signs."],
            ["Emergency SOS", "Triple-press, locked"],
            ["HealthKit", "Medical ID on lock"],
            ["Crash Detection", "Press if you're OK"],
            ["ActivityKit", "Island + watch"],
          ].map(([name, role]) => (
            <div key={name} className="ob-kit">
              <p className="ob-kit-n">{name}</p>
              <p className="ob-kit-r">{role}</p>
            </div>
          ))}
        </div>
        <div className="grouped mt-4">
          <div className="grouped-row">
            <span className="grouped-k">Single press</span>
            <span className="grouped-v">Heartbeat</span>
          </div>
          <div className="grouped-row">
            <span className="grouped-k">Double press</span>
            <span className="grouped-v">Seal a place</span>
          </div>
          <div className="grouped-row">
            <span className="grouped-k">Triple press</span>
            <span className="grouped-v">Emergency SOS</span>
          </div>
          <div className="grouped-row">
            <span className="grouped-k">Long press</span>
            <span className="grouped-v">Arm watch</span>
          </div>
        </div>
      </div>
      <p className="pb-6 text-center text-sm text-muted">
        Press the Action Button on the left to bind this device.
      </p>
    </div>
  );
}
