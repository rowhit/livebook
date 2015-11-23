var React = require("react");

var Collaborators = React.createClass({

  renderAvatars() {
    let avatars = this.props.peers.map((f) => {
          //<span>{f.session} [{f.cursor}]</span>
      let cursor = f.cursor
      if (f.cursor == undefined) cursor = "?"
      return (
        // BOOTS TODO
        // - these elements will desire a `key` prop at some point
        <li className={"observer " + f.status}>
          <span>{f.session + ":" + cursor }</span>
        </li>
      );
    })
    return avatars
  },

  render() {
    return (
    <div className="collaborators">
      <ul>{this.renderAvatars()}</ul>
    </div>
  )}
});


module.exports = Collaborators;
