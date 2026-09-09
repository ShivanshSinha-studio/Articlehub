const express= require('express');
const categoryRouter=express.Router();

const {PhysicArticle,AstronomyArticle,TechnologyArticle,BiologyArticle,
EarthArticle,ChemistryArticle,MathematicsArticle}=require('../controllers/categoryController');

categoryRouter.get('/article/physics',PhysicArticle);
categoryRouter.get('/article/astronomy',AstronomyArticle);
categoryRouter.get('/article/technology',TechnologyArticle);
categoryRouter.get('/article/biology',BiologyArticle);
categoryRouter.get('/article/earth',EarthArticle);
categoryRouter.get('/article/chemistry',ChemistryArticle);
categoryRouter.get('/article/mathematics',MathematicsArticle);

module.exports=categoryRouter;