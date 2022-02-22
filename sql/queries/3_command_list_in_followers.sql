WITH
    RECURSIVE followersthatbought(USER, depth, parent) AS (
    SELECT buy.idUser,
           0,
           0
    FROM buy
    WHERE buy.idProduct = 3 /*à remplacer par l'id du produit à chercher'*/
    UNION ALL
    SELECT link.idInflu,
           depth + 1,
           USER
    FROM followersthatbought,
         link,
         buy
    WHERE USER = link.idFollower
      AND buy.idProduct = 3 /*à remplacer par l'id du produit à chercher'*/
      AND buy.idUser = link.idInflu
      AND link.idInflu != parent
      AND link.idFollower != parent
      AND depth < 10 /*à remplacer par la profondeur max*/
)
SELECT depth,
       COUNT(USER) AS nbAchat
FROM (
         SELECT DISTINCT USER,
                         depth
         FROM followersthatbought
     ) AS ud
GROUP BY depth