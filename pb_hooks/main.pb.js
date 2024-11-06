/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/hello/:name", (c) => {
  let name = c.pathParam("name");

  return c.json(200, { message: "Hello " + name });
});

cronAdd("run_reports", "*/1 * * * *", () => {
  const result = arrayOf(
    new DynamicModel({
      id: "",
      name: "",
      fulcrum_query_sql: "",
      fulcrum_api_token: "",
      email_body: "",
      emails: "",
      file_name: "",
      cron_hour: "",
    })
  );

  $app
    .dao()
    .db()
    .select(
      "id",
      "name",
      "fulcrum_query_sql",
      "fulcrum_api_token",
      "email_body",
      "emails",
      "file_name",
      "cron_hour"
    )
    .from("reports")
    .all(result);

  result.forEach(async (report) => {
    const {
      id,
      name,
      fulcrum_query_sql,
      email_body,
      emails,
      fulcrum_api_token,
      file_name,
      cron_hour,
    } = report;

    // TODO: Check if cron_hour is current hour and only perform if true
    return;

    const headers = {
      "content-type": "application/json",
      "x-apitoken": fulcrum_api_token,
    };

    const body = JSON.stringify({
      q: fulcrum_query_sql,
      format: "csv",
    });

    const res = $http.send({
      url: "https://api.fulcrumapp.com/api/v2/query",
      method: "POST",
      body,
      headers,
    });

    const attachment = $filesystem
      .fileFromBytes(res.raw, file_name)
      .reader.open();

    const attachments = {
      [file_name]: attachment,
    };

    const message = new MailerMessage({
      from: {
        name: "Sequel Admin",
        address: "admin@sequelgroup.io",
      },
      to: emails.split(",").map((email) => ({ name: email, address: email })),
      subject: name,
      html: email_body,
      attachments,
    });

    $app.newMailClient().send(message);
  });
});
