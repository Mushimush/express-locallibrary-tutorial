const Genre = require("../models/genre");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");


// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
    const allGenre = await Genre.find().exec()
    res.render("genre_list", {
      title: "Genre List",
      genre_list: allGenre  
    })
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name }).exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];


// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [ genre, allGenreBook ] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ])
  if (genre == null) {
    res.redirect("/catalog/genre")
  }
  res.render("genre_delete", {
    title: "Delete Genre",
    genre: genre,
    allgenrebooks: allGenreBook,
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [ genre, allGenreBook] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id}, "title summary").exec()
  ])
  if (allGenreBook.length > 0){
    res.render("genre_delete",{
      title: "Delete Genre",
      genre: genre,
      allgenrebooks: allGenreBook,
    })
    return
  }else {
    await Genre.findByIdAndRemove(req.body.genreid)
    res.redirect("/catalog/genres")
  }

});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec()
  if (genre == null) {
    res.redirect("/catalog/genres")
  }
  res.render("genre_update", {
    title: "Update Genre",
    genre: genre
  })
});

// Handle Genre update on POST. You need to make a new 
exports.genre_update_post = [
  body("name", "Genre name must contain at least 3 characters")
  .trim()
  .isLength({ min: 3 })
  .escape(),

  asyncHandler(async(req,res,next) => {
    const errors = validationResult(req)
    const genre = new Genre({ name: req.body.name, _id:req.params.id})
    if (!errors.isEmpty()){
      const genre = await Genre.findById(req.params.id).exec()
      if (genre == null) {
        res.redirect("/catalog/genres")
      }
      res.render("genre_update", {
        title: "Update Genre",
        genre: genre,
        id: req.params.id
      })
      return
    }else {
      const thegenre = await Genre.findByIdAndUpdate(req.params.id,genre, {})
      res.redirect(thegenre.url)
    }
  })

]
