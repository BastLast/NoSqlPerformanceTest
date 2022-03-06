create table buy
(
    id        int auto_increment
        primary key,
    idUser    int not null,
    idProduct int not null
);

create index idProduct
    on buy (idProduct);

create index idUser
    on buy (idUser);

create table link
(
    id         int auto_increment
        primary key,
    idFollower int not null,
    idInflu    int not null
);

create index idFollower
    on link (idFollower);

create index idInflu
    on link (idInflu);

create table product
(
    id  int auto_increment
        primary key,
    ref varchar(50) not null
);

create table user
(
    id     int auto_increment
        primary key,
    nom    varchar(50) not null,
    prenom varchar(50) not null
)
    --engine = InnoDB;

