DELIMITER $$
DROP PROCEDURE IF EXISTS InsertUsers;
CREATE PROCEDURE InsertUsers(IN NumRows INT)
BEGIN
    DECLARE i INT;
    SET i = 1;
    START TRANSACTION;
    WHILE i <= NumRows DO
            INSERT INTO user VALUES (null,5 + CEIL(RAND() * (2500000 - 5)),5 + CEIL(RAND() * (2500000 - 5000000)));
            SET i = i + 1;
        END WHILE;
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS InsertProduct;
CREATE PROCEDURE InsertProduct(IN NumRows INT)
BEGIN
    DECLARE i INT;
    SET i = 1;
    START TRANSACTION;
    WHILE i <= NumRows DO
            INSERT INTO product VALUES (null,5 + CEIL(RAND() * (2500000 - 5)));
            SET i = i + 1;
        END WHILE;
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS InsertBuy;
CREATE PROCEDURE InsertBuy(IN NumUsers INT,IN NumProduct INT, IN NumBuyMax INT)
BEGIN
    DECLARE i INT;
    DECLARE NumFollow INT;
    DECLARE a INT;
    SET i = 1;
    START TRANSACTION;
    WHILE i <= NumUsers DO
            SET a = 1;
            SET NumFollow = 1 + CEIL(RAND() * (NumBuyMax - 1));
            WHILE a <= NumFollow DO
                    INSERT INTO buy VALUES (null,1 + CEIL(RAND() * (NumProduct - 1)),i);
                    SET a = a + 1;
                END WHILE;
            SET i = i + 1;
        END WHILE;
    COMMIT;
END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS InsertFollow;
CREATE PROCEDURE InsertFollow(IN NumRows INT, IN NumFollowMax INT)
BEGIN
    DECLARE i INT;
    DECLARE NumFollow INT;
    DECLARE a INT;
    SET i = 1;
    START TRANSACTION;
    WHILE i <= NumRows DO
            SET a = 1;
            SET NumFollow = 1 + CEIL(RAND() * (NumFollowMax - 1));
            WHILE a <= NumFollow DO
                    INSERT INTO link VALUES (null,i,1 + CEIL(RAND() * (NumRows - 1)));
                    SET a = a + 1;
                END WHILE;
            SET i = i + 1;
        END WHILE;
    COMMIT;
END$$
DELIMITER ;

TRUNCATE TABLE user;
TRUNCATE TABLE product;
TRUNCATE TABLE link;
TRUNCATE TABLE buy;
CALL InsertUsers(1000000);
CALL InsertProduct(10000);
CALL InsertFollow(1000000,20);
CALL InsertBuy(1000000,10000,5);
