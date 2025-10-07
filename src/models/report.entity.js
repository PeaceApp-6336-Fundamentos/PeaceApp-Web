export class Report {

    constructor(title = "", detail = "", type = "", user_id = 0, image = "https://picsum.photos/1600/900", address = "") {
        this.title = title;
        this.detail = detail;
        this.type = type;
        this.user_id = user_id;
        this.image = image;
        this.address = address;
    }

}
